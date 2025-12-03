import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EsimService } from '../esim/esim.service';
import { QueryProfilesResponse, UsageItem } from '../../../../../libs/esim-access/types';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrdersService {
  constructor(
    private stripe: StripeService,
    private prisma: PrismaService,
    private config: ConfigService,
    private esimService: EsimService,
    @Inject(forwardRef(() => EmailService))
    private emailService?: EmailService,
  ) {}
  private readonly logger = new Logger(OrdersService.name);

  async createStripeCheckout({ planCode, amount, currency, planName }) {
    // Convert USD dollars to cents (Stripe requires cents)
    this.logger.log(`[CHECKOUT] Received from frontend: amount=${amount} (dollars)`);
    const unit_amount_cents = Math.round(amount * 100);
    this.logger.log(`[CHECKOUT] Converted to Stripe: ${amount} dollars → ${unit_amount_cents} cents`);
    
    // Stripe minimum: $0.50 USD (50 cents) for most currencies
    const STRIPE_MINIMUM_CENTS = currency?.toLowerCase() === 'usd' ? 50 : 50;
    if (unit_amount_cents < STRIPE_MINIMUM_CENTS) {
      throw new Error(`Amount too low. Stripe requires a minimum charge of $${(STRIPE_MINIMUM_CENTS / 100).toFixed(2)} USD. This plan costs $${amount.toFixed(2)}.`);
    }
    
    const webUrl = this.config.get('WEB_URL') || 'http://localhost:3000';

    const session = await this.stripe.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency,
            unit_amount: unit_amount_cents,  // Stripe requires cents
            product_data: {
              name: planName,
            },
          },
          quantity: 1,
        },
      ],

      success_url: `${webUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${webUrl}/checkout/cancel`,
      metadata: {
        planCode,
      },
    });

    return { url: session.url };
  }

  async handleStripePayment(session: Stripe.Checkout.Session) {
    this.logger.log(`handleStripePayment start. session.id=${session?.id}`);
    this.logger.log(`session.metadata=${JSON.stringify(session?.metadata)}`);

    const email = session.customer_details?.email || 'guest@voyage.app';
    const planCode = session.metadata?.planCode || null;

    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: session.customer_details?.name || 'Guest',
      },
      update: {},
    });

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        planId: planCode || 'unknown',
        amountCents: session.amount_total ?? 0,
        currency: session.currency ?? 'usd',
        status: 'paid',
        paymentMethod: 'stripe',
        paymentRef: (session.payment_intent as string) || session.id,
        esimOrderNo: `PENDING-${session.id}`,
      },
    });

    // Send order confirmation email (fire and forget)
    this.sendOrderConfirmationEmail(order, user, planCode).catch((err) => {
      this.logger.error(`[EMAIL] Failed to send order confirmation: ${err.message}`);
    });

    await this.performEsimOrderForOrder(order, user, planCode, session);
  }

  async performEsimOrderForOrder(order, user, planCode: string, session?: Stripe.Checkout.Session) {
    // provider requires transactionId < 50 chars
    const transactionId = `stripe_${order.id}`;  
    // "stripe_" (7 chars) + UUID (36 chars) = 43 chars (valid)
    
    // Convert Stripe cents to provider format (1/10000th units)
    // Stripe: 25 cents = $0.25 → Provider: 2500 (1/10000th units) = $0.25
    const amountInProviderUnits = (order.amountCents ?? 0) * 100;
    
    const body = {
      transactionId,
      packageInfoList: [{ 
        packageCode: planCode, 
        count: 1,
        price: amountInProviderUnits, // Provider expects price in their format
      }],
      amount: amountInProviderUnits,
    };

    // 1) CALL ESIM PROVIDER
    let esimResult: any = null;

    try {
      this.logger.log(
        `[ESIM][ORDER] Calling provider...\n` +
        `URL: /esim/order\n` +
        `transactionId=${transactionId}\n` +
        `packageInfoList=${JSON.stringify(body.packageInfoList)}\n` +
        `amount=${body.amount}`
      );

      esimResult = await this.esimService.sdk.client.request(
        'POST',
        '/esim/order',
        body
      );

      this.logger.log(`[ESIM][ORDER] RAW RESPONSE: ${JSON.stringify(esimResult, null, 2)}`);
    } catch (err) {
      this.logger.error('[ESIM][ORDER] REQUEST FAILED');
      this.logger.error(err);

      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'esim_order_failed' },
      });
      return;
    }

    // 2) PARSE THE RESPONSE
    const orderNo = esimResult?.obj?.orderNo;

    if (!orderNo) {
      this.logger.warn(
        `[ESIM][ORDER] Missing orderNo!\n` +
        `Full provider response:\n${JSON.stringify(esimResult, null, 2)}`
      );

      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'esim_no_orderno' },
      });
      return;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { esimOrderNo: orderNo },
    });

    const pollQuery = async (attempts = 10, delayMs = 3000) => {
      for (let i = 0; i < attempts; i++) {
        try {
          this.logger.log(`[ESIM][QUERY] Calling provider for orderNo=${orderNo}`);

          const res = await this.esimService.sdk.client.request<QueryProfilesResponse>(
            'POST',
            '/esim/query',
            { orderNo, pager: { pageNum: 1, pageSize: 50 } }
          );

          this.logger.log(`[ESIM][QUERY] RAW RESPONSE: ${JSON.stringify(res, null, 2)}`);

          if (res?.obj?.esimList?.length > 0) return res;
        } catch (err) {
          this.logger.warn('ESIM QUERY FAILED', err);
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
      return null;
    };

    const queryResult = await pollQuery();

    if (!queryResult || !queryResult.obj?.esimList?.length) {
      this.logger.warn(`ESIM pending for ${order.id}`);
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'esim_pending' },
      });
      return;
    }

    const profile = queryResult.obj.esimList[0];

    // Check if profile already exists for this order
    const existingProfile = await this.prisma.esimProfile.findFirst({
      where: { orderId: order.id },
    });

    if (existingProfile) {
      // Update existing profile instead of creating duplicate
      await this.prisma.esimProfile.update({
        where: { id: existingProfile.id },
        data: {
          esimTranNo: profile.esimTranNo || existingProfile.esimTranNo,
          iccid: profile.iccid || existingProfile.iccid,
          qrCodeUrl: profile.qrCodeUrl || existingProfile.qrCodeUrl,
          ac: profile.ac || existingProfile.ac,
          smdpStatus: profile.smdpStatus || existingProfile.smdpStatus,
          esimStatus: profile.esimStatus || existingProfile.esimStatus,
          expiredTime: profile.expiredTime ? new Date(profile.expiredTime) : existingProfile.expiredTime,
          totalVolume: profile.totalVolume ?? existingProfile.totalVolume,
        },
      });
      this.logger.log(`Updated existing eSIM profile for order ${order.id}`);
    } else {
      // Create new profile
      await this.prisma.esimProfile.create({
        data: {
          orderId: order.id,
          userId: user.id,
          esimTranNo: profile.esimTranNo || null,
          iccid: profile.iccid || null,
          qrCodeUrl: profile.qrCodeUrl || null,
          ac: profile.ac || null,
          smdpStatus: profile.smdpStatus || null,
          esimStatus: profile.esimStatus || null,
          expiredTime: profile.expiredTime ? new Date(profile.expiredTime) : null,
          totalVolume: profile.totalVolume ?? null,
        },
      });
      this.logger.log(`Created new eSIM profile for order ${order.id}`);
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'esim_created' },
    });

    this.logger.log(`Created REAL eSIM profile for order ${order.id}`);

    // Send eSIM ready email with receipt download link included (fire and forget)
    this.sendEsimReadyEmail(order, user, planCode, profile).catch((err) => {
      this.logger.error(`[EMAIL] Failed to send eSIM ready email: ${err.message}`);
    });

    // Also mark receipt as sent (receipt link is included in eSIM ready email)
    try {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { receiptSent: true },
      });
      this.logger.log(`[EMAIL] Marked receipt as sent for order ${order.id} (included in eSIM ready email)`);
    } catch (err) {
      this.logger.warn(`[EMAIL] Failed to mark receipt as sent: ${err.message}`);
    }
  }

  async retryPendingForPaymentRef(paymentRef: string) {
    this.logger.log(`retryPendingForPaymentRef: ${paymentRef}`);

    const orders = await this.prisma.order.findMany({
      where: {
        OR: [
          { paymentRef },
          { esimOrderNo: { startsWith: `PENDING-${paymentRef}` } },
        ],
        status: { in: ['esim_no_orderno', 'esim_pending'] },
      },
    });

    this.logger.log(`Found ${orders.length} pending order(s)`);

    for (const order of orders) {
      const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
      await this.performEsimOrderForOrder(order, user, order.planId, undefined as any);
    }
  }

  // ============================================
  // HELPER: FIND PROFILE BY ICCID
  // ============================================
  async findByIccid(iccid: string) {
    return this.prisma.esimProfile.findFirst({
      where: { iccid },
      include: {
        order: true,
        user: true,
      },
    });
  }

  // ============================================
  // FEATURE 1: AUTOMATIC RETRY FOR FAILED ORDERS
  // ============================================
  async retryPendingOrders() {
    this.logger.log('[RETRY] Starting retry cycle for pending orders...');

    const pendingOrders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['esim_no_orderno', 'esim_pending', 'esim_order_failed'],
        },
      },
      include: {
        user: true,
      },
      take: 10, // Process max 10 orders per cycle to avoid overwhelming
    });

    this.logger.log(`[RETRY] Found ${pendingOrders.length} pending order(s) to retry`);

    for (const order of pendingOrders) {
      try {
        this.logger.log(`[RETRY] Processing order ${order.id} (status: ${order.status})`);

        // Build the same transactionId format as original
        const transactionId = `stripe_${order.id}`;
        
        // Convert Stripe cents to provider format (1/10000th units)
        const amountInProviderUnits = (order.amountCents ?? 0) * 100;

        const body = {
          transactionId,
          packageInfoList: [
            {
              packageCode: order.planId,
              count: 1,
              price: amountInProviderUnits,
            },
          ],
          amount: amountInProviderUnits,
        };

        // Call eSIM provider
        let esimResult: any = null;
        try {
          this.logger.log(
            `[RETRY] Calling provider for order ${order.id}...\n` +
            `transactionId=${transactionId}\n` +
            `packageCode=${order.planId}\n` +
            `amount=${amountInProviderUnits}`
          );

          esimResult = await this.esimService.sdk.client.request(
            'POST',
            '/esim/order',
            body
          );

          this.logger.log(`[RETRY] Provider response for order ${order.id}: ${JSON.stringify(esimResult, null, 2)}`);
        } catch (err) {
          this.logger.error(`[RETRY] Provider request failed for order ${order.id}:`, err);
          // Leave order as pending, don't fail permanently
          continue;
        }

        // Check if we got an orderNo
        const orderNo = esimResult?.obj?.orderNo;

        if (!orderNo) {
          this.logger.warn(`[RETRY] Still no orderNo for order ${order.id}, leaving as pending`);
          // Leave status unchanged, will retry next cycle
          continue;
        }

        // Update order with orderNo and set status to provisioning
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            esimOrderNo: orderNo,
            status: 'provisioning',
          },
        });

        this.logger.log(`[RETRY] Got orderNo ${orderNo} for order ${order.id}, querying profiles...`);

        // Immediately query for eSIM profile
        const pollQuery = async (attempts = 5, delayMs = 3000) => {
          for (let i = 0; i < attempts; i++) {
            try {
              this.logger.log(`[RETRY] Query attempt ${i + 1}/${attempts} for orderNo=${orderNo}`);

              const res = await this.esimService.sdk.client.request<QueryProfilesResponse>(
                'POST',
                '/esim/query',
                { orderNo, pager: { pageNum: 1, pageSize: 50 } }
              );

              if (res?.obj?.esimList?.length > 0) {
                return res;
              }
            } catch (err) {
              this.logger.warn(`[RETRY] Query failed for orderNo=${orderNo}:`, err);
            }
            await new Promise((r) => setTimeout(r, delayMs));
          }
          return null;
        };

        const queryResult = await pollQuery();

        if (!queryResult || !queryResult.obj?.esimList?.length) {
          this.logger.warn(`[RETRY] No profile yet for order ${order.id}, setting status to esim_pending`);
          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'esim_pending' },
          });
          continue;
        }

        const profile = queryResult.obj.esimList[0];

        // Check if profile already exists for this order
        const existingProfile = await this.prisma.esimProfile.findFirst({
          where: { orderId: order.id },
        });

        if (existingProfile) {
          // Update existing profile
          await this.prisma.esimProfile.update({
            where: { id: existingProfile.id },
            data: {
              esimTranNo: profile.esimTranNo || existingProfile.esimTranNo,
              iccid: profile.iccid || existingProfile.iccid,
              qrCodeUrl: profile.qrCodeUrl || existingProfile.qrCodeUrl,
              ac: profile.ac || existingProfile.ac,
              smdpStatus: profile.smdpStatus || existingProfile.smdpStatus,
              esimStatus: profile.esimStatus || existingProfile.esimStatus,
              expiredTime: profile.expiredTime ? new Date(profile.expiredTime) : existingProfile.expiredTime,
              totalVolume: profile.totalVolume ?? existingProfile.totalVolume,
            },
          });
        } else {
          // Create new profile
          await this.prisma.esimProfile.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              esimTranNo: profile.esimTranNo || `TEMP_${order.id}`,
              iccid: profile.iccid || '',
              qrCodeUrl: profile.qrCodeUrl || null,
              ac: profile.ac || null,
              smdpStatus: profile.smdpStatus || null,
              esimStatus: profile.esimStatus || null,
              expiredTime: profile.expiredTime ? new Date(profile.expiredTime) : null,
              totalVolume: profile.totalVolume ?? null,
            },
          });
        }

        // Update order status to esim_created
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'esim_created' },
        });

        this.logger.log(`[RETRY] Successfully created/updated eSIM profile for order ${order.id}`);

        // Send emails ONLY ONCE if they haven't been sent yet (for orders that transitioned from pending/failed)
        // IMPORTANT: We only send emails when a profile is successfully created, NOT during pending retries
        const updatedOrder = await this.prisma.order.findUnique({
          where: { id: order.id },
          include: { user: true },
        });

        // Double-check: Only send if receipt hasn't been sent yet (prevents duplicates during retries)
        if (updatedOrder && !updatedOrder.receiptSent) {
          const createdProfile = await this.prisma.esimProfile.findFirst({
            where: { orderId: order.id },
            orderBy: { id: 'asc' },
          });

          // Only send emails if profile actually exists (not for pending orders)
          if (createdProfile) {
            this.logger.log(`[RETRY] Sending emails for order ${order.id} (was pending/failed, now succeeded)`);
            
            // Send eSIM ready email with receipt link (combined email)
            this.sendEsimReadyEmail(updatedOrder, updatedOrder.user, order.planId, createdProfile).catch((err) => {
              this.logger.error(`[RETRY][EMAIL] Failed to send eSIM ready email: ${err.message}`);
            });

            // Mark receipt as sent IMMEDIATELY to prevent duplicate emails on future retries
            try {
              await this.prisma.order.update({
                where: { id: order.id },
                data: { receiptSent: true },
              });
              this.logger.log(`[RETRY][EMAIL] Marked receipt as sent for order ${order.id} (emails will NOT be sent again)`);
            } catch (err) {
              this.logger.warn(`[RETRY][EMAIL] Failed to mark receipt as sent: ${err.message}`);
            }
          } else {
            // No profile yet - don't send emails (order is still pending)
            this.logger.log(`[RETRY] Order ${order.id} has no profile yet, skipping email send (still pending)`);
          }
        } else if (updatedOrder?.receiptSent) {
          // Receipt already sent - skip to prevent duplicates
          this.logger.log(`[RETRY] Order ${order.id} already sent receipt, skipping email (no duplicates)`);
        }
      } catch (err) {
        this.logger.error(`[RETRY] Error processing order ${order.id}:`, err);
        // Continue with next order, don't fail permanently
      }
    }

    this.logger.log('[RETRY] Retry cycle completed');

    // After retry, check for orders with profiles but no emails sent yet
    // (e.g., profiles created via webhook while retry was running)
    await this.sendEmailsForPendingReceipts();
  }

  private async sendEmailsForPendingReceipts() {
    this.logger.log('[EMAIL] Checking for orders with profiles but no emails sent...');

    // Find orders that have profiles but haven't sent receipt email
    // IMPORTANT: Only processes orders where receiptSent = false (prevents duplicates)
    // IMPORTANT: Only processes orders that HAVE profiles (not pending orders)
    const ordersWithProfiles = await this.prisma.order.findMany({
      where: {
        receiptSent: false, // Only orders that haven't sent emails yet
        profiles: {
          some: {}, // Has at least one profile (not pending)
        },
      },
      include: {
        user: true,
        profiles: {
          orderBy: { id: 'asc' },
          take: 1, // Just need first profile for email
        },
      },
    });

    if (ordersWithProfiles.length === 0) {
      this.logger.log('[EMAIL] No orders found that need emails');
      return;
    }

    this.logger.log(`[EMAIL] Found ${ordersWithProfiles.length} order(s) that need emails`);

    for (const order of ordersWithProfiles) {
      try {
        const profile = order.profiles[0];
        if (!profile) continue;

        this.logger.log(`[EMAIL] Sending emails for order ${order.id} (profile created, emails not sent)`);

        // Send eSIM ready email with receipt link (combined email) - ONLY ONCE
        await this.sendEsimReadyEmail(order, order.user, order.planId, profile);

        // Mark receipt as sent IMMEDIATELY to prevent duplicate emails on future retries/webhooks
        await this.prisma.order.update({
          where: { id: order.id },
          data: { receiptSent: true },
        });

        this.logger.log(`[EMAIL] Successfully sent emails for order ${order.id} (marked receiptSent=true, won't send again)`);
      } catch (err) {
        this.logger.error(`[EMAIL] Failed to send emails for order ${order.id}: ${err.message}`);
      }
    }
  }

  // ============================================
  // FEATURE 3: SYNC FOR USAGE & STATUS
  // ============================================
  async syncEsimProfiles() {
    this.logger.log('[SYNC] Starting sync cycle for all eSIM profiles...');

    const profiles = await this.prisma.esimProfile.findMany({
      include: {
        order: true,
      },
    });

    this.logger.log(`[SYNC] Found ${profiles.length} profile(s) to sync`);

    // Step 1: Sync profile status, volume, expiry, etc. from /esim/query
    for (const profile of profiles) {
      try {
        const orderNo = profile.order?.esimOrderNo;

        if (!orderNo) {
          this.logger.warn(`[SYNC] Skipping profile ${profile.id} - no orderNo found`);
          continue;
        }

        this.logger.log(`[SYNC] Syncing profile ${profile.id} (orderNo: ${orderNo})`);

        // Query provider for latest profile data
        const res = await this.esimService.sdk.client.request<QueryProfilesResponse>(
          'POST',
          '/esim/query',
          { orderNo, pager: { pageNum: 1, pageSize: 50 } }
        );

        if (!res?.obj?.esimList || res.obj.esimList.length === 0) {
          this.logger.warn(`[SYNC] No profile data found for orderNo ${orderNo}`);
          continue;
        }

        // Find matching profile by iccid or esimTranNo
        const providerProfile = res.obj.esimList.find(
          (p) => p.iccid === profile.iccid || p.esimTranNo === profile.esimTranNo
        ) || res.obj.esimList[0]; // Fallback to first if no match

        // Update profile with latest data
        const updateData: any = {};

        if (providerProfile.esimStatus !== undefined) {
          updateData.esimStatus = providerProfile.esimStatus;
        }
        if (providerProfile.totalVolume !== undefined) {
          updateData.totalVolume = providerProfile.totalVolume;
        }
        if (providerProfile.expiredTime) {
          updateData.expiredTime = new Date(providerProfile.expiredTime);
        }
        if (providerProfile.smdpStatus !== undefined) {
          updateData.smdpStatus = providerProfile.smdpStatus;
        }
        if (providerProfile.qrCodeUrl !== undefined) {
          updateData.qrCodeUrl = providerProfile.qrCodeUrl;
        }
        if (providerProfile.ac !== undefined) {
          updateData.ac = providerProfile.ac;
        }
        if (providerProfile.iccid !== undefined && providerProfile.iccid !== profile.iccid) {
          updateData.iccid = providerProfile.iccid;
        }
        if (providerProfile.esimTranNo !== undefined && providerProfile.esimTranNo !== profile.esimTranNo) {
          updateData.esimTranNo = providerProfile.esimTranNo;
        }

        if (Object.keys(updateData).length > 0) {
          await this.prisma.esimProfile.update({
            where: { id: profile.id },
            data: updateData,
          });

          this.logger.log(`[SYNC] Updated profile ${profile.id} with: ${Object.keys(updateData).join(', ')}`);
        } else {
          this.logger.log(`[SYNC] No updates needed for profile ${profile.id}`);
        }
      } catch (err) {
        this.logger.error(`[SYNC] Error syncing profile ${profile.id}:`, err);
        // Continue with next profile
      }
    }

    // Step 2: Sync usage data (orderUsage) from /esim/usage/query
    this.logger.log('[SYNC] Starting usage sync for all profiles...');
    
    // Collect all esimTranNo values from profiles that have them
    const profilesWithTranNo = profiles.filter(p => p.esimTranNo);
    
    this.logger.log(`[SYNC] Found ${profilesWithTranNo.length} profile(s) with esimTranNo out of ${profiles.length} total`);
    
    if (profilesWithTranNo.length === 0) {
      this.logger.log('[SYNC] No profiles with esimTranNo found, skipping usage sync');
      this.logger.log('[SYNC] Sync cycle completed');
      return;
    }
    
    // Log all esimTranNos for debugging
    const tranNos = profilesWithTranNo.map(p => p.esimTranNo).filter(Boolean);
    this.logger.log(`[SYNC] Will query usage for esimTranNos: ${JSON.stringify(tranNos)}`);

    // Batch process usage queries (API may have limits, so we'll do in chunks of 50)
    const BATCH_SIZE = 50;
    const tranNoBatches: string[][] = [];
    
    for (let i = 0; i < profilesWithTranNo.length; i += BATCH_SIZE) {
      tranNoBatches.push(
        profilesWithTranNo
          .slice(i, i + BATCH_SIZE)
          .map(p => p.esimTranNo!)
          .filter(Boolean)
      );
    }

    this.logger.log(`[SYNC] Processing ${profilesWithTranNo.length} profiles in ${tranNoBatches.length} batch(es)`);

    for (let batchIdx = 0; batchIdx < tranNoBatches.length; batchIdx++) {
      const tranNoBatch = tranNoBatches[batchIdx];
      
      try {
        this.logger.log(`[SYNC] Fetching usage for batch ${batchIdx + 1}/${tranNoBatches.length} (${tranNoBatch.length} profiles)`);
        this.logger.log(`[SYNC] Requesting usage for esimTranNos: ${JSON.stringify(tranNoBatch)}`);
        
        // Call usage API
        const usageResponse: any = await this.esimService.sdk.usage.getUsage(tranNoBatch);
        
        this.logger.log(`[SYNC] Usage API response: ${JSON.stringify(usageResponse, null, 2)}`);
        
        // Check for API errors (errorCode "0" means success, anything else is an error)
        const isError = usageResponse?.success === false || 
                       usageResponse?.success === "false" ||
                       (usageResponse?.errorCode && usageResponse.errorCode !== "0" && usageResponse.errorCode !== 0);
        
        if (isError) {
          this.logger.error(`[SYNC] Usage API error: ${usageResponse.errorCode} - ${usageResponse.errorMessage || usageResponse.errorMsg || 'Unknown error'}`);
          continue;
        }
        
        // The API actually returns: { obj: { esimUsageList: UsageItem[] } }
        // Check both possible structures for compatibility
        let usageData: UsageItem[] = [];
        
        if (usageResponse?.obj) {
          if (Array.isArray(usageResponse.obj)) {
            // Direct array format
            usageData = usageResponse.obj;
          } else if ((usageResponse.obj as any).esimUsageList && Array.isArray((usageResponse.obj as any).esimUsageList)) {
            // Nested esimUsageList format (actual API structure)
            usageData = (usageResponse.obj as any).esimUsageList;
          }
        }
        
        if (!usageData || usageData.length === 0) {
          this.logger.log(`[SYNC] No usage data returned for batch ${batchIdx + 1} - profile may be unused or not ready yet`);
          continue;
        }
        this.logger.log(`[SYNC] Received usage data for ${usageData.length} profile(s) in batch ${batchIdx + 1}`);

        // Update each profile with usage data
        for (const usageItem of usageData) {
          try {
            const profile = profilesWithTranNo.find(p => p.esimTranNo === usageItem.esimTranNo);
            
            if (!profile) {
              this.logger.warn(`[SYNC] Usage data received for unknown esimTranNo: ${usageItem.esimTranNo}`);
              continue;
            }

            const updateData: any = {};

            // dataUsage is the consumed amount (this is orderUsage)
            // Even if 0, we should update it to indicate the profile has been checked
            if (usageItem.dataUsage !== undefined) {
              const newUsage = BigInt(usageItem.dataUsage);
              const oldUsage = profile.orderUsage;

              // Create usage history record if usage changed
              if (!oldUsage || oldUsage !== newUsage) {
                try {
                  await this.prisma.esimUsageHistory.create({
                    data: {
                      profileId: profile.id,
                      usedBytes: newUsage,
                    },
                  });
                  this.logger.log(`[SYNC] Created usage history record for profile ${profile.id}: ${newUsage} bytes`);
                } catch (err) {
                  // Don't fail sync if history creation fails
                  this.logger.warn(`[SYNC] Failed to create usage history for profile ${profile.id}:`, err);
                }
              }

              updateData.orderUsage = newUsage;
            }

            // Optionally update totalVolume if different (though we already sync this above)
            if (usageItem.totalData !== undefined) {
              const totalDataBigInt = BigInt(usageItem.totalData);
              // Only update if it's different from what we have
              if (!profile.totalVolume || profile.totalVolume !== totalDataBigInt) {
                updateData.totalVolume = totalDataBigInt;
              }
            }

            if (Object.keys(updateData).length > 0) {
              await this.prisma.esimProfile.update({
                where: { id: profile.id },
                data: updateData,
              });

              this.logger.log(
                `[SYNC] Updated usage for profile ${profile.id}: ` +
                `orderUsage=${usageItem.dataUsage}, totalData=${usageItem.totalData}`
              );
            }
          } catch (err) {
            this.logger.error(`[SYNC] Error updating usage for esimTranNo ${usageItem.esimTranNo}:`, err);
            // Continue with next usage item
          }
        }
      } catch (err) {
        this.logger.error(`[SYNC] Error fetching usage for batch ${batchIdx + 1}:`, err);
        // Continue with next batch
      }
    }

    this.logger.log('[SYNC] Sync cycle completed');
  }

  // Email helper methods (made public for resend endpoint)
  async sendOrderConfirmationEmail(order: any, user: any, planCode: string) {
    if (!this.emailService) {
      this.logger.warn('[EMAIL] EmailService not available, skipping order confirmation');
      return;
    }

    try {
      // Fetch plan details
      let planDetails: any = null;
      try {
        planDetails = await this.esimService.getPlan(planCode);
      } catch (err) {
        this.logger.warn(`[EMAIL] Could not fetch plan details for ${planCode}: ${err.message}`);
      }

      const appUrl = this.config.get('WEB_URL') || 'http://localhost:3000';
      const amount = (order.amountCents / 100).toFixed(2);

      await this.emailService.sendOrderConfirmation(
        user.email,
        {
          user: {
            name: user.name || 'Customer',
            email: user.email,
          },
          order: {
            id: order.id,
            amount,
            currency: order.currency?.toUpperCase() || 'USD',
            status: this.getHumanReadableOrderStatus(order.status),
          },
          plan: {
            name: planDetails?.name || planCode,
            packageCode: planCode,
          },
          appUrl,
        },
        `order-${order.id}`,
      );
    } catch (err) {
      this.logger.error(`[EMAIL] Error sending order confirmation: ${err.message}`);
      throw err;
    }
  }

  public async sendEsimReadyEmail(order: any, user: any, planCode: string, profile: any) {
    if (!this.emailService) {
      this.logger.warn('[EMAIL] EmailService not available, skipping eSIM ready email');
      return;
    }

    try {
      // Fetch plan details
      let planDetails: any = null;
      try {
        planDetails = await this.esimService.getPlan(planCode);
      } catch (err) {
        this.logger.warn(`[EMAIL] Could not fetch plan details for ${planCode}: ${err.message}`);
      }

      const appUrl = this.config.get('WEB_URL') || 'http://localhost:3000';
      const apiUrl = this.config.get('API_URL') || appUrl.replace(':3000', ':3001');
      const totalVolumeGB = profile.totalVolume ? (Number(profile.totalVolume) / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : null;

      // Include receipt download link in eSIM ready email
      const receiptDownloadUrl = `${apiUrl}/api/orders/${order.id}/receipt?email=${encodeURIComponent(user.email)}`;

      await this.emailService.sendEsimReady(
        user.email,
        {
          user: {
            name: user.name || 'Customer',
            email: user.email,
          },
          profile: {
            id: profile.id,
            iccid: profile.iccid,
            esimStatus: this.getHumanReadableEsimStatus(profile.esimStatus),
            totalVolume: totalVolumeGB,
            expiredTime: profile.expiredTime ? new Date(profile.expiredTime).toLocaleDateString() : null,
            qrCodeUrl: profile.qrCodeUrl,
          },
          plan: {
            name: planDetails?.name || planCode,
            packageCode: planCode,
          },
          receiptDownloadUrl,
          appUrl,
        },
        `esim-${profile.id || order.id}`,
      );
    } catch (err) {
      this.logger.error(`[EMAIL] Error sending eSIM ready email: ${err.message}`);
      throw err;
    }
  }

  private getHumanReadableOrderStatus(status: string): string {
    const statusLower = status.toLowerCase();
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      payment_pending: 'Payment Pending',
      paid: 'Paid',
      provisioning: 'Provisioning',
      esim_created: 'eSIM Created',
      active: 'Active',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      canceled: 'Cancelled',
    };
    return statusMap[statusLower] || status;
  }

  private getHumanReadableEsimStatus(status: string): string {
    if (!status) return 'Unknown';
    const statusUpper = status.toUpperCase();
    const statusMap: Record<string, string> = {
      'GOT_RESOURCE': 'Ready',
      'IN_USE': 'Active',
      'USED_UP': 'Data Used Up',
      'USED_EXPIRED': 'Expired (Used)',
      'UNUSED_EXPIRED': 'Expired (Unused)',
      'CANCEL': 'Cancelled',
      'REVOKED': 'Revoked',
      'DOWNLOAD': 'Ready to Download',
      'INSTALLATION': 'Installing',
      'ENABLED': 'Enabled',
      'DISABLED': 'Disabled',
      'DELETED': 'Deleted',
    };
    return statusMap[statusUpper] || status;
  }

  async sendReceiptEmail(order: any, user: any, planCode: string) {
    if (!this.emailService) {
      this.logger.warn('[EMAIL] EmailService not available, skipping receipt email');
      return;
    }

    try {
      // Fetch plan details
      let planDetails: any = null;
      try {
        planDetails = await this.esimService.getPlan(planCode);
      } catch (err) {
        this.logger.warn(`[EMAIL] Could not fetch plan details for ${planCode}: ${err.message}`);
      }

      const appUrl = this.config.get('WEB_URL') || 'http://localhost:3000';
      const apiUrl = this.config.get('API_URL') || appUrl.replace(':3000', ':3001');
      const amount = (order.amountCents / 100).toFixed(2);
      const currency = order.currency?.toUpperCase() || 'USD';

      // Format price with currency symbol
      let priceFormatted: string;
      try {
        priceFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(parseFloat(amount));
      } catch (err) {
        priceFormatted = `${currency} ${amount}`;
      }

      const receiptDownloadUrl = `${apiUrl}/api/orders/${order.id}/receipt?email=${encodeURIComponent(user.email)}`;

      const result = await this.emailService.sendReceiptEmail(
        user.email,
        {
          userName: user.name || 'Customer',
          orderId: order.id,
          planName: planDetails?.name || planCode,
          priceFormatted,
          receiptDownloadUrl,
          appUrl,
        },
        `receipt-${order.id}`,
      );

      // Mark receipt as sent if email was successfully sent (not skipped/mocked)
      if (result.success || result.mock) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { receiptSent: true },
        });
        this.logger.log(`[EMAIL] Marked receipt as sent for order ${order.id}`);
      }
    } catch (err) {
      this.logger.error(`[EMAIL] Error sending receipt email: ${err.message}`);
      throw err;
    }
  }
}