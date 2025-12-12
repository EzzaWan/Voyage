import { Injectable, Logger, Inject, forwardRef, BadRequestException, NotFoundException } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EsimService } from '../esim/esim.service';
import { QueryProfilesResponse, UsageItem } from '../../../../../libs/esim-access/types';
import { EmailService } from '../email/email.service';
import { CurrencyService } from '../currency/currency.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import { AffiliateCommissionService } from '../affiliate/affiliate-commission.service';
import { FraudDetectionService } from '../affiliate/fraud/fraud-detection.service';
import { VCashService } from '../vcash/vcash.service';
import { AdminSettingsService } from '../admin/admin-settings.service';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private stripe: StripeService,
    private prisma: PrismaService,
    private config: ConfigService,
    private esimService: EsimService,
    private currencyService: CurrencyService,
    private affiliateService: AffiliateService,
    private vcashService: VCashService,
    @Inject(forwardRef(() => AffiliateCommissionService))
    private commissionService?: AffiliateCommissionService,
    @Inject(forwardRef(() => EmailService))
    private emailService?: EmailService,
    @Inject(forwardRef(() => FraudDetectionService))
    private fraudDetection?: FraudDetectionService,
    @Inject(forwardRef(() => AdminSettingsService))
    private adminSettingsService?: AdminSettingsService,
  ) {}
  private readonly logger = new Logger(OrdersService.name);

  async createStripeCheckout({ planCode, amount, currency, planName, displayCurrency, referralCode }: {
    planCode: string;
    amount: number;
    currency: string;
    planName: string;
    displayCurrency?: string;
    referralCode?: string;
  }) {
    try {
      // amount is in USD (final price after discounts, calculated by frontend)
      // currency is the target currency for Stripe checkout
      // displayCurrency is optional, same as currency for UI consistency
      
      this.logger.log(`[CHECKOUT] Received from frontend: amount=${amount} USD (final price with discounts), targetCurrency=${currency || 'USD'}`);
      
      // Validate Stripe is configured
      if (!this.stripe?.stripe) {
        this.logger.error('[CHECKOUT] Stripe is not configured. STRIPE_SECRET is missing.');
        throw new BadRequestException('Payment system is not configured. Please contact support.');
      }
      
      // Determine target currency: use provided currency, or fallback to admin default, or USD
      let targetCurrency: string;
      try {
        targetCurrency = currency?.toUpperCase() || (await this.currencyService.getDefaultCurrency()) || 'USD';
      } catch (error) {
        this.logger.warn('[CHECKOUT] Failed to get default currency, using USD', error);
        targetCurrency = 'USD';
      }
      
      this.logger.log(`[CHECKOUT] Target currency: ${targetCurrency}`);
      
      // Convert USD amount to target currency
      let convertedAmount = amount; // Default to USD amount
      if (targetCurrency !== 'USD') {
        try {
          convertedAmount = await this.currencyService.convert(amount, targetCurrency);
          this.logger.log(`[CHECKOUT] Converted ${amount} USD → ${convertedAmount.toFixed(2)} ${targetCurrency}`);
        } catch (error) {
          this.logger.error(`[CHECKOUT] Currency conversion failed, using USD amount`, error);
          targetCurrency = 'USD';
          convertedAmount = amount;
        }
      }
      
      // Convert to cents (Stripe requires cents)
      const unit_amount_cents = Math.round(convertedAmount * 100);
      this.logger.log(`[CHECKOUT] Final Stripe amount: ${unit_amount_cents} cents (${convertedAmount.toFixed(2)} ${targetCurrency})`);
      
      // Stripe minimum: $0.50 USD equivalent for most currencies
      // For non-USD, we'll use a conservative minimum
      const STRIPE_MINIMUM_USD = 0.50;
      let minimumInTargetCurrency = STRIPE_MINIMUM_USD;
      if (targetCurrency !== 'USD') {
        try {
          minimumInTargetCurrency = await this.currencyService.convert(STRIPE_MINIMUM_USD, targetCurrency);
        } catch (error) {
          this.logger.warn('[CHECKOUT] Failed to convert minimum, using USD minimum', error);
          minimumInTargetCurrency = STRIPE_MINIMUM_USD;
        }
      }
      const STRIPE_MINIMUM_CENTS = Math.round(minimumInTargetCurrency * 100);
      
      if (unit_amount_cents < STRIPE_MINIMUM_CENTS) {
        throw new BadRequestException(
          `Amount too low. Stripe requires a minimum charge equivalent to $${STRIPE_MINIMUM_USD.toFixed(2)} USD. ` +
          `This plan costs ${convertedAmount.toFixed(2)} ${targetCurrency} (${amount.toFixed(2)} USD).`
        );
      }
      
      const webUrl = this.config.get('WEB_URL') || 'http://localhost:3000';

      const session = await this.stripe.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],

        line_items: [
          {
            price_data: {
              currency: targetCurrency.toLowerCase(), // Stripe expects lowercase
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
          amountUSD: amount.toString(), // Store original USD amount in metadata
          displayCurrency: displayCurrency || targetCurrency,
          ...(referralCode ? { referralCode } : {}), // Include referral code if provided
        },
      });

      this.logger.log(`[CHECKOUT] Stripe session created: ${session.id}`);
      return { url: session.url };
    } catch (error) {
      this.logger.error('[CHECKOUT] Failed to create Stripe checkout session', error);
      
      // If it's already a NestJS exception, re-throw it
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Otherwise, wrap it
      throw new BadRequestException(
        error instanceof Error 
          ? `Failed to create checkout: ${error.message}` 
          : 'Failed to create checkout. Please try again.'
      );
    }
  }

  async createVCashOrder({ planCode, amount, currency, planName, displayCurrency, referralCode, email }: {
    planCode: string;
    amount: number;
    currency: string;
    planName: string;
    displayCurrency?: string;
    referralCode?: string;
    email: string;
  }) {
    this.logger.log(`[VCASH CHECKOUT] Received from frontend: amount=${amount} USD, email=${email}, planCode=${planCode}`);

    // Auto-create user if they don't exist (e.g., just signed up via Clerk)
    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        id: crypto.randomUUID(),
        email,
        name: null, // Name will be updated when they make first purchase
      },
      update: {},
    });

    // Calculate amount in USD cents
    const amountUSDCents = Math.round(amount * 100);
    
    // Check V-Cash balance
    const vcashBalance = await this.vcashService.getBalance(user.id);
    
    if (vcashBalance < amountUSDCents) {
      throw new BadRequestException(
        `Insufficient V-Cash balance. Available: $${(vcashBalance / 100).toFixed(2)}, Required: $${(amountUSDCents / 100).toFixed(2)}`
      );
    }

    // Get display currency (or default to USD)
    const targetCurrency = currency?.toUpperCase() || await this.currencyService.getDefaultCurrency() || 'USD';
    let displayAmountCents = amountUSDCents;
    
    // Convert to display currency if needed
    if (targetCurrency !== 'USD') {
      const convertedAmount = await this.currencyService.convert(amount, targetCurrency);
      displayAmountCents = Math.round(convertedAmount * 100);
    }

    // Create order first (before debiting to ensure order exists if something fails)
    const orderId = crypto.randomUUID();
    
    // Debit V-Cash
    const ip = 'system'; // V-Cash orders are internal, no IP tracking needed
    await this.vcashService.debit(
      user.id,
      amountUSDCents,
      `ORDER_PAYMENT_${orderId}`,
      { orderId, planCode, planName },
      ip
    );

    this.logger.log(`[VCASH CHECKOUT] Debited ${amountUSDCents} cents from user ${user.id}. Creating order...`);

    // Create order
    const order = await this.prisma.order.create({
      data: {
        id: orderId,
        userId: user.id,
        planId: planCode || 'unknown',
        amountCents: amountUSDCents,
        currency: 'usd',
        displayCurrency: targetCurrency,
        displayAmountCents: displayAmountCents,
        status: 'paid',
        paymentMethod: 'vcash',
        paymentRef: `vcash_${orderId}`,
        esimOrderNo: `PENDING-${orderId}`,
      },
    });

    // Handle referral if provided
    if (referralCode) {
      this.logger.log(`[AFFILIATE] Processing referral code: ${referralCode} for user ${user.id} (email: ${email})`);
      this.handleReferral(referralCode, user.id).catch((err) => {
        this.logger.error(`[AFFILIATE] Failed to handle referral:`, err);
      });
    }

    // Send order confirmation email (fire and forget)
    this.sendOrderConfirmationEmail(order, user, planCode).catch((err) => {
      this.logger.error(`[EMAIL] Failed to send order confirmation: ${err.message}`);
    });

    // Trigger eSIM provisioning (async, don't wait)
    this.performEsimOrderForOrder(order, user, planCode).catch((err) => {
      this.logger.error(`[ESIM] Failed to provision eSIM for V-Cash order ${orderId}:`, err);
    });

    this.logger.log(`[VCASH CHECKOUT] Order ${orderId} created successfully. V-Cash balance remaining: $${((vcashBalance - amountUSDCents) / 100).toFixed(2)}`);

    return {
      success: true,
      orderId: order.id,
      message: 'Order created successfully with V-Cash payment',
    };
  }

  async handleStripePayment(session: Stripe.Checkout.Session) {
    this.logger.log(`handleStripePayment start. session.id=${session?.id}`);
    this.logger.log(`session.metadata=${JSON.stringify(session?.metadata)}`);

    const email = session.customer_details?.email || 'guest@voyage.app';
    const planCode = session.metadata?.planCode || null;
    const referralCode = session.metadata?.referralCode || null;
    
    this.logger.log(`[CHECKOUT] Processing payment: email=${email}, planCode=${planCode}, referralCode=${referralCode || 'none'}`);

    // Check if user exists before upsert
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        id: crypto.randomUUID(),
        email,
        name: session.customer_details?.name || 'Guest',
      },
      update: {},
    });

    // Create affiliate record for user (if new user, this will create one)
    if (!existingUser) {
      // New user - create affiliate record
      this.affiliateService.createAffiliateForUser(user.id).catch((err) => {
        this.logger.error(`[AFFILIATE] Failed to create affiliate for user ${user.id}:`, err);
      });
    }

    // Handle referral if referral code provided (for both new and existing users)
    // This ensures referrals are linked even if user was created via Clerk webhook
    if (referralCode) {
      this.logger.log(`[AFFILIATE] Processing referral code: ${referralCode} for user ${user.id} (email: ${email})`);
      this.handleReferral(referralCode, user.id).catch((err) => {
        this.logger.error(`[AFFILIATE] Failed to handle referral:`, err);
      });
    } else {
      this.logger.log(`[AFFILIATE] No referral code provided for user ${user.id} (email: ${email})`);
    }

    // Get original USD amount from metadata, or convert from Stripe amount
    let amountUSD = parseFloat(session.metadata?.amountUSD || '0');
    let currencyUSD = 'usd';
    
    // If metadata doesn't have USD amount, we need to convert from Stripe currency
    if (amountUSD === 0 && session.amount_total) {
      const stripeCurrency = session.currency?.toUpperCase() || 'USD';
      if (stripeCurrency !== 'USD') {
        // Convert from Stripe currency back to USD
        const stripeAmountDollars = (session.amount_total ?? 0) / 100;
        const rate = await this.currencyService.getRate(stripeCurrency);
        amountUSD = stripeAmountDollars / rate;
        this.logger.log(`[CHECKOUT] Converted ${stripeAmountDollars} ${stripeCurrency} back to ${amountUSD.toFixed(2)} USD`);
      } else {
        amountUSD = (session.amount_total ?? 0) / 100;
      }
    }
    
    // Store amount in USD cents (always store in USD internally)
    const amountUSDCents = Math.round(amountUSD * 100);
    
    // Get display currency (currency user actually paid in)
    const displayCurrency = (session.metadata?.displayCurrency || session.currency?.toUpperCase() || 'USD').toUpperCase();
    
    // Get display amount (amount actually paid in display currency, in cents)
    const displayAmountCents = session.amount_total || amountUSDCents;
    
    this.logger.log(`[CHECKOUT] Storing order: ${amountUSDCents} cents (${amountUSD.toFixed(2)} USD) in database, displayCurrency=${displayCurrency}, displayAmountCents=${displayAmountCents}`);

    const order = await this.prisma.order.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        planId: planCode || 'unknown',
        amountCents: amountUSDCents, // Always store in USD cents
        currency: currencyUSD, // Always store as USD
        displayCurrency: displayCurrency, // Currency user actually paid in
        displayAmountCents: displayAmountCents, // Amount actually paid in display currency
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

  /**
   * Get the current provider price for a package code.
   * This fetches the latest price from the provider API to handle price expiration.
   * Falls back to reverse-calculating from marked-up order amount if fetch fails.
   */
  private async getProviderPriceInUnits(packageCode: string, fallbackMarkedUpCents: number): Promise<number> {
    try {
      // Fetch current provider price (handles price expiration)
      const packageDetails = await this.esimService.getEsimAccess().packages.getPackageDetails(packageCode);
      if (packageDetails.obj?.packageList?.[0]?.price) {
        const providerPriceInUnits = packageDetails.obj.packageList[0].price;
        this.logger.log(`[PRICE] Fetched current provider price for ${packageCode}: ${providerPriceInUnits} provider units`);
        return providerPriceInUnits;
      } else {
        this.logger.warn(`[PRICE] Package ${packageCode} not found in provider response, using fallback calculation`);
      }
    } catch (err) {
      this.logger.error(`[PRICE] Failed to fetch provider price for ${packageCode}, using fallback calculation:`, err);
    }

    // Fallback: reverse-calculate original price from marked-up amount
    const markupPercent = this.adminSettingsService ? await this.adminSettingsService.getDefaultMarkupPercent() : 0;
    if (markupPercent > 0) {
      const originalCents = Math.round(fallbackMarkedUpCents / (1 + markupPercent / 100));
      const providerPriceInUnits = originalCents * 100; // Convert to provider units (1/10000th)
      this.logger.log(`[PRICE] Calculated provider price from marked-up amount (${fallbackMarkedUpCents} cents, ${markupPercent}% markup): ${providerPriceInUnits} provider units`);
      return providerPriceInUnits;
    } else {
      // No markup, use the amount as-is
      const providerPriceInUnits = fallbackMarkedUpCents * 100;
      this.logger.log(`[PRICE] No markup configured, using order amount: ${providerPriceInUnits} provider units`);
      return providerPriceInUnits;
    }
  }

  async performEsimOrderForOrder(order, user, planCode: string, session?: Stripe.Checkout.Session) {
    // provider requires transactionId < 50 chars
    // Use payment method prefix: stripe_ or vcash_
    const paymentPrefix = order.paymentMethod === 'vcash' ? 'vcash_' : 'stripe_';
    const transactionId = `${paymentPrefix}${order.id}`;  
    // "stripe_" or "vcash_" (7 chars) + UUID (36 chars) = 43 chars (valid)
    
    // Get current provider price (NOT the marked-up customer price)
    // order.amountCents contains the marked-up price that customer paid
    // Provider expects their original cost price, not our selling price
    const amountInProviderUnits = await this.getProviderPriceInUnits(planCode, order.amountCents ?? 0);
    
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
          id: crypto.randomUUID(),
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

    // Add commission if user was referred
    this.addCommissionForOrder(order).catch((err) => {
      this.logger.error(`[AFFILIATE] Failed to add commission for order ${order.id}:`, err);
    });

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
        Order: true,
        User: true,
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
        User: true,
      },
      take: 10, // Process max 10 orders per cycle to avoid overwhelming
    });

    this.logger.log(`[RETRY] Found ${pendingOrders.length} pending order(s) to retry`);

    for (const order of pendingOrders) {
      try {
        this.logger.log(`[RETRY] Processing order ${order.id} (status: ${order.status})`);

        // Build the same transactionId format as original
        const paymentPrefix = order.paymentMethod === 'vcash' ? 'vcash_' : 'stripe_';
        const transactionId = `${paymentPrefix}${order.id}`;
        
        // Get current provider price (NOT the marked-up customer price)
        // order.amountCents contains the marked-up price that customer paid
        // Provider expects their original cost price, not our selling price
        const amountInProviderUnits = await this.getProviderPriceInUnits(order.planId, order.amountCents ?? 0);

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
              id: crypto.randomUUID(),
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
          include: { User: true },
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
            this.sendEsimReadyEmail(updatedOrder, updatedOrder.User, order.planId, createdProfile).catch((err) => {
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
        EsimProfile: {
          some: {}, // Has at least one profile (not pending)
        },
      },
      include: {
        User: true,
        EsimProfile: {
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
        const profile = order.EsimProfile[0];
        if (!profile) continue;

        this.logger.log(`[EMAIL] Sending emails for order ${order.id} (profile created, emails not sent)`);

        // Send eSIM ready email with receipt link (combined email) - ONLY ONCE
        await this.sendEsimReadyEmail(order, order.User, order.planId, profile);

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
        Order: true,
      },
    });

    this.logger.log(`[SYNC] Found ${profiles.length} profile(s) to sync`);

    // Step 1: Sync profile status, volume, expiry, etc. from /esim/query
    for (const profile of profiles) {
      try {
        const orderNo = profile.Order?.esimOrderNo;

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
                      id: crypto.randomUUID(),
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

  // ============================================
  // AFFILIATE METHODS
  // ============================================

  /**
   * Handle referral when a new user signs up with a referral code
   */
  private async handleReferral(referralCode: string, referredUserId: string): Promise<void> {
      try {
        this.logger.log(`[AFFILIATE] Looking up referral code: ${referralCode}`);
        const affiliate = await this.affiliateService.findAffiliateByCode(referralCode);
        if (!affiliate) {
          this.logger.warn(`[AFFILIATE] Invalid referral code: ${referralCode} - affiliate not found`);
          return;
        }

        this.logger.log(`[AFFILIATE] Found affiliate: ${affiliate.id} (userId: ${affiliate.userId}) for referral code: ${referralCode}`);

        // Prevent self-referral
        if (affiliate.userId === referredUserId) {
          this.logger.warn(`[AFFILIATE] User tried to refer themselves: ${referredUserId} (affiliate userId: ${affiliate.userId})`);
          return;
        }

        this.logger.log(`[AFFILIATE] Creating referral link: affiliate ${affiliate.id} -> user ${referredUserId}`);
        await this.affiliateService.createReferral(affiliate.id, referredUserId);
        this.logger.log(`[AFFILIATE] Successfully created referral for user ${referredUserId} from affiliate ${affiliate.id}`);
      } catch (error) {
        this.logger.error(`[AFFILIATE] Failed to handle referral for code ${referralCode} and user ${referredUserId}:`, error);
      }
    }

  /**
   * Add commission for a completed order
   * NOTE: V-Cash payments do NOT generate commissions
   */
  private async addCommissionForOrder(order: any): Promise<void> {
      try {
        // Fetch fresh order to ensure we have all fields including displayAmountCents
        const freshOrder = await this.prisma.order.findUnique({
          where: { id: order.id },
          select: {
            id: true,
            userId: true,
            amountCents: true,
            displayAmountCents: true,
            displayCurrency: true,
            paymentRef: true,
            paymentMethod: true,
          },
        });

        if (!freshOrder) {
          this.logger.warn(`[AFFILIATE] Order not found: ${order.id}`);
          return;
        }

        // Skip commission for V-Cash payments
        if (freshOrder.paymentMethod === 'vcash') {
          this.logger.log(`[AFFILIATE] Skipping commission for order ${freshOrder.id} - V-Cash payment method`);
          return;
        }

        // Check if commission already exists for this order to prevent duplicates
        const existingCommission = await this.prisma.commission.findFirst({
          where: {
            orderId: freshOrder.id,
            orderType: 'order',
          },
        });

        if (existingCommission) {
          this.logger.log(`[AFFILIATE] Commission already exists for order ${freshOrder.id}, skipping duplicate creation`);
          return;
        }

        // Find if the user was referred
        const referral = await this.prisma.referral.findUnique({
          where: { referredUserId: freshOrder.userId },
          include: {
            Affiliate: true,
          },
        });

        if (!referral || !referral.Affiliate) {
          // User was not referred, no commission
          return;
        }

        // Check payment method for fraud if fraud detection is available
        if (this.fraudDetection && freshOrder.paymentRef) {
          try {
            // Get payment method details from Stripe
            const paymentIntent = await this.stripe.stripe.paymentIntents.retrieve(freshOrder.paymentRef);
            if (paymentIntent.payment_method) {
              const pm = typeof paymentIntent.payment_method === 'string'
                ? await this.stripe.stripe.paymentMethods.retrieve(paymentIntent.payment_method)
                : paymentIntent.payment_method;
              
              const paymentMethodId = pm.id;
              const cardLast4 = pm.card?.last4 || '';
              const cardFingerprint = pm.card?.fingerprint || null;

              // Run payment method fraud check
              this.fraudDetection.checkPaymentMethod(
                paymentMethodId,
                cardLast4,
                cardFingerprint,
                referral.affiliateId,
                freshOrder.id,
                freshOrder.userId,
              ).catch((err) => {
                this.logger.warn('[FRAUD] Failed to check payment method:', err);
              });
            }
          } catch (err) {
            this.logger.warn('[FRAUD] Failed to retrieve payment method for fraud check:', err);
          }
        }

        // Add 10% commission based on USD amount (base currency)
        // IMPORTANT: Always use amountCents (USD) for commission calculation, not displayAmountCents
        // displayAmountCents is in the user's local currency and would cause incorrect commissions
        // Example: 100 PHP might be $2 USD - commission should be 10% of $2, not 10% of 100 PHP
        const commissionAmountCents = freshOrder.amountCents;
        
        this.logger.log(
          `[AFFILIATE] Adding commission for order ${freshOrder.id}: ` +
          `USD amount=${commissionAmountCents} cents (${(commissionAmountCents / 100).toFixed(2)} USD) ` +
          `display=${freshOrder.displayAmountCents || 'N/A'} cents (${freshOrder.displayCurrency || 'USD'})`
        );
        
        // Use new commission service if available, otherwise fallback to old method
        if (this.commissionService) {
          await this.commissionService.createCommission(
            referral.affiliateId,
            freshOrder.id,
            'order',
            commissionAmountCents,
          );
        } else {
          await this.affiliateService.addCommission(
            referral.affiliateId,
            freshOrder.id,
            'order',
            commissionAmountCents,
          );
        }

        // Run fraud checks for refund patterns after commission is created
        if (this.fraudDetection) {
          this.fraudDetection.checkRefundPattern(referral.affiliateId, freshOrder.id, freshOrder.userId).catch((err) => {
            this.logger.warn('[FRAUD] Failed to check refund pattern:', err);
          });
        }

        this.logger.log(`[AFFILIATE] Added commission for order ${order.id} to affiliate ${referral.affiliateId}`);
      } catch (error) {
        this.logger.error(`[AFFILIATE] Failed to add commission for order:`, error);
      }
    }
}