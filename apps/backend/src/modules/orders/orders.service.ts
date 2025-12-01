import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EsimService } from '../esim/esim.service';
import { QueryProfilesResponse } from '../../../../../libs/esim-access/types';

@Injectable()
export class OrdersService {
  constructor(
    private stripe: StripeService,
    private prisma: PrismaService,
    private config: ConfigService,
    private esimService: EsimService,
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

    await this.performEsimOrderForOrder(order, user, planCode, session);
  }

  private async performEsimOrderForOrder(order, user, planCode: string, session?: Stripe.Checkout.Session) {
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

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'esim_created' },
    });

    this.logger.log(`Created REAL eSIM profile for order ${order.id}`);
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
      } catch (err) {
        this.logger.error(`[RETRY] Error processing order ${order.id}:`, err);
        // Continue with next order, don't fail permanently
      }
    }

    this.logger.log('[RETRY] Retry cycle completed');
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
        // Note: orderUsage is not provided by the eSIM Access API in the profile response
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

    this.logger.log('[SYNC] Sync cycle completed');
  }
}