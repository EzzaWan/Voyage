import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EsimService } from '../esim/esim.service';
import { QueryProfilesResponse } from '../../../../../libs/esim-access/types';
import { EmailService } from '../email/email.service';
import { CurrencyService } from '../currency/currency.service';
import { AffiliateService } from '../affiliate/affiliate.service';

@Injectable()
export class TopUpService {
  private readonly logger = new Logger(TopUpService.name);

  constructor(
    private stripe: StripeService,
    private prisma: PrismaService,
    private config: ConfigService,
    private esimService: EsimService,
    private currencyService: CurrencyService,
    private affiliateService: AffiliateService,
    @Inject(forwardRef(() => EmailService))
    private emailService?: EmailService,
  ) {}

  async createStripeTopUpCheckout(profileId: string, planCode: string, amount: number, currency: string, displayCurrency?: string) {
    // amount is in USD (base price)
    // currency is the target currency for Stripe checkout
    
    this.logger.log(`[TOPUP] Creating checkout for profileId=${profileId}, planCode=${planCode}, amount=${amount} USD, targetCurrency=${currency || 'USD'}`);

    // Verify profile exists
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id: profileId },
      include: { User: true },
    });

    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    // Determine target currency: use provided currency, or fallback to admin default, or USD
    let targetCurrency = currency?.toUpperCase() || await this.currencyService.getDefaultCurrency() || 'USD';
    
    this.logger.log(`[TOPUP] Target currency: ${targetCurrency}`);
    
    // Convert USD amount to target currency
    let convertedAmount = amount; // Default to USD amount
    if (targetCurrency !== 'USD') {
      convertedAmount = await this.currencyService.convert(amount, targetCurrency);
      this.logger.log(`[TOPUP] Converted ${amount} USD → ${convertedAmount.toFixed(2)} ${targetCurrency}`);
    }
    
    // Convert to cents (Stripe requires cents)
    const unit_amount_cents = Math.round(convertedAmount * 100);
    this.logger.log(`[TOPUP] Final Stripe amount: ${unit_amount_cents} cents (${convertedAmount.toFixed(2)} ${targetCurrency})`);
    
    // Stripe minimum: $0.50 USD equivalent for most currencies
    const STRIPE_MINIMUM_USD = 0.50;
    const minimumInTargetCurrency = targetCurrency === 'USD' 
      ? STRIPE_MINIMUM_USD 
      : await this.currencyService.convert(STRIPE_MINIMUM_USD, targetCurrency);
    const STRIPE_MINIMUM_CENTS = Math.round(minimumInTargetCurrency * 100);
    
    if (unit_amount_cents < STRIPE_MINIMUM_CENTS) {
      throw new Error(
        `Amount too low. Stripe requires a minimum charge equivalent to $${STRIPE_MINIMUM_USD.toFixed(2)} USD. ` +
        `This top-up costs ${convertedAmount.toFixed(2)} ${targetCurrency} (${amount.toFixed(2)} USD).`
      );
    }

    const webUrl = this.config.get('WEB_URL') || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await this.stripe.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: targetCurrency.toLowerCase(), // Stripe expects lowercase
            unit_amount: unit_amount_cents,  // Stripe requires cents
            product_data: {
              name: `Top-up for eSIM Profile`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${webUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${webUrl}/checkout/cancel`,
      metadata: {
        type: 'topup',
        profileId,
        planCode,
        amountUSD: amount.toString(), // Store original USD amount in metadata
        displayCurrency: displayCurrency || targetCurrency,
      },
    });

    // Create TopUp record in database (store in USD)
    await this.prisma.topUp.create({
      data: {
        id: crypto.randomUUID(),
        userId: profile.userId || profile.User?.id || '',
        profileId: profile.id,
        planCode,
        amountCents: Math.round(amount * 100), // Always store in USD cents
        currency: 'usd', // Always store as USD
        status: 'pending',
        paymentRef: session.id,
      },
    });

    this.logger.log(`[TOPUP] Created topup record for profile ${profileId}, session ${session.id}`);

    return { url: session.url };
  }

  async createStripeTopUpCheckoutByIccid(iccid: string, planCode: string, amount: number, currency: string, displayCurrency?: string) {
    const profile = await this.prisma.esimProfile.findFirst({
      where: { iccid },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ICCID ${iccid} not found`);
    }

    return this.createStripeTopUpCheckout(profile.id, planCode, amount, currency, displayCurrency);
  }

  async handleStripeTopUp(session: Stripe.Checkout.Session) {
    this.logger.log(`[TOPUP] Handling Stripe payment for session ${session.id}`);

    const profileId = session.metadata?.profileId;
    const planCode = session.metadata?.planCode;

    if (!profileId || !planCode) {
      this.logger.error(`[TOPUP] Missing metadata: profileId=${profileId}, planCode=${planCode}`);
      return;
    }

    // Find topup record
    const topup = await this.prisma.topUp.findFirst({
      where: { paymentRef: session.id },
      include: { EsimProfile: true },
    });

    if (!topup) {
      this.logger.error(`[TOPUP] Topup not found for paymentRef ${session.id}`);
      return;
    }

    // Update topup with display currency and amount
    const displayCurrency = (session.metadata?.displayCurrency || session.currency?.toUpperCase() || 'USD').toUpperCase();
    const displayAmountCents = session.amount_total || topup.amountCents;
    
    await this.prisma.topUp.update({
      where: { id: topup.id },
      data: {
        displayCurrency: displayCurrency,
        displayAmountCents: displayAmountCents,
      },
    });

    // Get profile to access esimTranNo
    const profile = topup.EsimProfile;
    if (!profile || !profile.esimTranNo) {
      this.logger.error(`[TOPUP] Profile not found or missing esimTranNo for topup ${topup.id}`);
      await this.prisma.topUp.update({
        where: { id: topup.id },
        data: { status: 'failed' },
      });
      return;
    }

    // Call provider /esim/topup
    const transactionId = `recharge_${session.id}`;

    try {
      this.logger.log(
        `[TOPUP] Calling provider for topup ${topup.id}...\n` +
        `esimTranNo=${profile.esimTranNo}\n` +
        `packageCode=${planCode}\n` +
        `transactionId=${transactionId}`
      );

      const result = await this.esimService.sdk.topup.topupProfile({
        esimTranNo: profile.esimTranNo,
        packageCode: planCode,
        transactionId,
      });

      this.logger.log(`[TOPUP] Provider response: ${JSON.stringify(result, null, 2)}`);

      // Check if we got a recharge order number
      const rechargeOrder = result?.obj?.orderNo || result?.obj?.rechargeOrder || null;

      if (rechargeOrder) {
        await this.prisma.topUp.update({
          where: { id: topup.id },
          data: {
            status: 'processing',
            rechargeOrder,
          },
        });

        this.logger.log(`[TOPUP] Topup ${topup.id} set to processing with rechargeOrder ${rechargeOrder}`);

        // Start polling for recharge status
        setTimeout(() => this.pollRechargeOrder(topup.id), 5000);
      } else {
        this.logger.warn(`[TOPUP] No rechargeOrder returned for topup ${topup.id}`);
        await this.prisma.topUp.update({
          where: { id: topup.id },
          data: { status: 'failed' },
        });
      }
    } catch (err) {
      this.logger.error(`[TOPUP] Provider call failed for topup ${topup.id}:`, err);
      await this.prisma.topUp.update({
        where: { id: topup.id },
        data: { status: 'failed' },
      });
    }
  }

  async pollRechargeOrder(topupId: string) {
    this.logger.log(`[TOPUP] Polling recharge order for topup ${topupId}`);

    const topup = await this.prisma.topUp.findUnique({
      where: { id: topupId },
      include: {
        EsimProfile: {
          include: {
            Order: true,
          },
        },
      },
    });

    if (!topup || !topup.EsimProfile) {
      this.logger.error(`[TOPUP] Topup or profile not found for ${topupId}`);
      return;
    }

    if (topup.status !== 'processing' && topup.status !== 'pending') {
      this.logger.log(`[TOPUP] Topup ${topupId} is not in processing/pending status, skipping poll`);
      return;
    }

    try {
      // Query provider for profile status by iccid (most reliable for topups)
      // We can also use orderNo if rechargeOrder is available, but iccid is better
      const iccid = topup.EsimProfile.iccid;
      const orderNo = topup.rechargeOrder;
      
      if (!iccid) {
        this.logger.warn(`[TOPUP] No iccid available for topup ${topupId}`);
        return;
      }

      // Query by iccid (most reliable for checking profile status after topup)
      this.logger.log(`[TOPUP] Querying provider for iccid ${iccid}`);
      
      const queryParams: any = {
        iccid,
        pager: { pageNum: 1, pageSize: 50 },
      };

      const res = await this.esimService.sdk.client.request<QueryProfilesResponse>(
        'POST',
        '/esim/query',
        queryParams
      );

      if (!res?.obj?.esimList || res.obj.esimList.length === 0) {
        this.logger.log(`[TOPUP] No profile data found yet for topup ${topupId}`);
        return;
      }

      // Find matching profile
      const providerProfile = res.obj.esimList.find(
        (p) => p.iccid === topup.EsimProfile.iccid || p.esimTranNo === topup.EsimProfile.esimTranNo
      ) || res.obj.esimList[0];

      // Check if totalVolume or usage has changed (indicating recharge applied)
      const newTotalVolume = providerProfile.totalVolume ?? null;
      const oldTotalVolume = topup.EsimProfile.totalVolume;

      if (newTotalVolume !== null && oldTotalVolume !== null) {
        const volumeIncreased = BigInt(newTotalVolume) > BigInt(oldTotalVolume);
        
        if (volumeIncreased) {
          // Update profile with new volume
          await this.prisma.esimProfile.update({
            where: { id: topup.EsimProfile.id },
            data: {
              totalVolume: newTotalVolume,
              esimStatus: providerProfile.esimStatus || topup.EsimProfile.esimStatus,
              smdpStatus: providerProfile.smdpStatus || topup.EsimProfile.smdpStatus,
            },
          });

          // Mark topup as completed
          await this.prisma.topUp.update({
            where: { id: topup.id },
            data: { status: 'completed' },
          });

          this.logger.log(`[TOPUP] Topup ${topupId} completed! Volume increased from ${oldTotalVolume} to ${newTotalVolume}`);

          // Add commission if user was referred
          this.addCommissionForTopup(topup).catch((err) => {
            this.logger.error(`[AFFILIATE] Failed to add commission for topup ${topup.id}:`, err);
          });

          // Send top-up confirmation email (fire and forget)
          this.sendTopupConfirmationEmail(topup).catch((err) => {
            this.logger.error(`[EMAIL] Failed to send top-up confirmation: ${err.message}`);
          });
        } else {
          this.logger.log(`[TOPUP] Topup ${topupId} still processing, volume not increased yet`);
        }
      } else if (newTotalVolume !== null && oldTotalVolume === null) {
        // First time we have volume data, update profile
        await this.prisma.esimProfile.update({
          where: { id: topup.EsimProfile.id },
          data: {
            totalVolume: newTotalVolume,
            esimStatus: providerProfile.esimStatus || topup.EsimProfile.esimStatus,
            smdpStatus: providerProfile.smdpStatus || topup.EsimProfile.smdpStatus,
          },
        });

        await this.prisma.topUp.update({
          where: { id: topup.id },
          data: { status: 'completed' },
        });

        this.logger.log(`[TOPUP] Topup ${topupId} completed! Volume set to ${newTotalVolume}`);

        // Add commission if user was referred
        this.addCommissionForTopup(topup).catch((err) => {
          this.logger.error(`[AFFILIATE] Failed to add commission for topup ${topup.id}:`, err);
        });
      }
    } catch (err) {
      this.logger.error(`[TOPUP] Error polling recharge order for topup ${topupId}:`, err);
    }
  }

  async getUserTopUps(userId: string) {
    return this.prisma.topUp.findMany({
      where: { userId },
      include: {
        EsimProfile: {
          select: {
            id: true,
            iccid: true,
            esimTranNo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTopUpsByIccid(iccid: string) {
    return this.prisma.topUp.findMany({
      where: {
        EsimProfile: {
          iccid: iccid
        }
      },
      include: {
        EsimProfile: {
          select: {
            id: true,
            iccid: true,
            esimTranNo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingTopUps() {
    return this.prisma.topUp.findMany({
      where: {
        status: {
          in: ['pending', 'processing'],
        },
      },
      include: {
        EsimProfile: {
          include: {
            Order: true,
          },
        },
      },
    });
  }

  // Email helper method
  private async sendTopupConfirmationEmail(topup: any) {
    if (!this.emailService) {
      this.logger.warn('[EMAIL] EmailService not available, skipping top-up confirmation');
      return;
    }

    try {
      // Fetch topup with relations
      const fullTopup = await this.prisma.topUp.findUnique({
        where: { id: topup.id },
        include: {
          User: true,
          EsimProfile: {
            include: {
              Order: true,
            },
          },
        },
      });

      if (!fullTopup) {
        this.logger.warn(`[EMAIL] Topup ${topup.id} not found for email`);
        return;
      }

      // Fetch plan details
      let planDetails: any = null;
      try {
        planDetails = await this.esimService.getPlan(fullTopup.planCode);
      } catch (err) {
        this.logger.warn(`[EMAIL] Could not fetch plan details for ${fullTopup.planCode}: ${err.message}`);
      }

      const appUrl = this.config.get('WEB_URL') || 'http://localhost:3000';
      const amount = (fullTopup.amountCents / 100).toFixed(2);

      await this.emailService.sendTopupConfirmation(
        fullTopup.User.email,
        {
          user: {
            name: fullTopup.User.name || 'Customer',
            email: fullTopup.User.email,
          },
          topup: {
            id: fullTopup.id,
            amount,
            currency: fullTopup.currency?.toUpperCase() || 'USD',
            status: fullTopup.status,
          },
          EsimProfile: {
            iccid: fullTopup.EsimProfile.iccid,
          },
          plan: {
            name: planDetails?.name || fullTopup.planCode,
            packageCode: fullTopup.planCode,
          },
          appUrl,
        },
        `topup-${fullTopup.id}`,
      );
    } catch (err) {
      this.logger.error(`[EMAIL] Error sending top-up confirmation: ${err.message}`);
      throw err;
    }
  }

  /**
   * Add commission for a completed top-up
   */
  private async addCommissionForTopup(topup: any): Promise<void> {
    try {
      // Find if the user was referred
      const referral = await this.prisma.referral.findUnique({
        where: { referredUserId: topup.userId },
        include: {
          Affiliate: true,
        },
      });

      if (!referral || !referral.Affiliate) {
        // User was not referred, no commission
        return;
      }

      // Add 10% commission - use displayAmountCents if available
      const commissionAmountCents = topup.displayAmountCents || topup.amountCents;
      
      // Try to use new commission service (injected if available)
      // For now, use the updated addCommission which handles pending status
      await this.affiliateService.addCommission(
        referral.affiliateId,
        topup.id,
        'topup',
        commissionAmountCents,
      );

      this.logger.log(`[AFFILIATE] Added commission for topup ${topup.id} to affiliate ${referral.affiliateId}`);
    } catch (error) {
      this.logger.error(`[AFFILIATE] Failed to add commission for topup:`, error);
    }
  }
}

