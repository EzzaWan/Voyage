import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EsimService } from '../esim/esim.service';
import { QueryProfilesResponse } from '../../../../../libs/esim-access/types';

@Injectable()
export class TopUpService {
  private readonly logger = new Logger(TopUpService.name);

  constructor(
    private stripe: StripeService,
    private prisma: PrismaService,
    private config: ConfigService,
    private esimService: EsimService,
  ) {}

  async createStripeTopUpCheckout(profileId: string, planCode: string, amount: number, currency: string) {
    this.logger.log(`[TOPUP] Creating checkout for profileId=${profileId}, planCode=${planCode}, amount=${amount}`);

    // Verify profile exists
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
    }

    // Convert USD dollars to cents (Stripe requires cents)
    const unit_amount_cents = Math.round(amount * 100);

    // Stripe minimum: $0.50 USD (50 cents)
    if (unit_amount_cents < 50) {
      throw new Error(`Amount too low. Stripe requires a minimum charge of $0.50 USD.`);
    }

    const webUrl = this.config.get('WEB_URL') || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await this.stripe.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: unit_amount_cents,
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
      },
    });

    // Create TopUp record in database
    await this.prisma.topUp.create({
      data: {
        userId: profile.userId || profile.user?.id || '',
        profileId: profile.id,
        planCode,
        amountCents: unit_amount_cents,
        currency,
        status: 'pending',
        paymentRef: session.id,
      },
    });

    this.logger.log(`[TOPUP] Created topup record for profile ${profileId}, session ${session.id}`);

    return { url: session.url };
  }

  async createStripeTopUpCheckoutByIccid(iccid: string, planCode: string, amount: number, currency: string) {
    const profile = await this.prisma.esimProfile.findFirst({
      where: { iccid },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ICCID ${iccid} not found`);
    }

    return this.createStripeTopUpCheckout(profile.id, planCode, amount, currency);
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
      include: { profile: true },
    });

    if (!topup) {
      this.logger.error(`[TOPUP] Topup not found for paymentRef ${session.id}`);
      return;
    }

    // Get profile to access esimTranNo
    const profile = topup.profile;
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
        profile: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!topup || !topup.profile) {
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
      const iccid = topup.profile.iccid;
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
        (p) => p.iccid === topup.profile.iccid || p.esimTranNo === topup.profile.esimTranNo
      ) || res.obj.esimList[0];

      // Check if totalVolume or usage has changed (indicating recharge applied)
      const newTotalVolume = providerProfile.totalVolume ?? null;
      const oldTotalVolume = topup.profile.totalVolume;

      if (newTotalVolume !== null && oldTotalVolume !== null) {
        const volumeIncreased = BigInt(newTotalVolume) > BigInt(oldTotalVolume);
        
        if (volumeIncreased) {
          // Update profile with new volume
          await this.prisma.esimProfile.update({
            where: { id: topup.profile.id },
            data: {
              totalVolume: newTotalVolume,
              esimStatus: providerProfile.esimStatus || topup.profile.esimStatus,
              smdpStatus: providerProfile.smdpStatus || topup.profile.smdpStatus,
            },
          });

          // Mark topup as completed
          await this.prisma.topUp.update({
            where: { id: topup.id },
            data: { status: 'completed' },
          });

          this.logger.log(`[TOPUP] Topup ${topupId} completed! Volume increased from ${oldTotalVolume} to ${newTotalVolume}`);
        } else {
          this.logger.log(`[TOPUP] Topup ${topupId} still processing, volume not increased yet`);
        }
      } else if (newTotalVolume !== null && oldTotalVolume === null) {
        // First time we have volume data, update profile
        await this.prisma.esimProfile.update({
          where: { id: topup.profile.id },
          data: {
            totalVolume: newTotalVolume,
            esimStatus: providerProfile.esimStatus || topup.profile.esimStatus,
            smdpStatus: providerProfile.smdpStatus || topup.profile.smdpStatus,
          },
        });

        await this.prisma.topUp.update({
          where: { id: topup.id },
          data: { status: 'completed' },
        });

        this.logger.log(`[TOPUP] Topup ${topupId} completed! Volume set to ${newTotalVolume}`);
      }
    } catch (err) {
      this.logger.error(`[TOPUP] Error polling recharge order for topup ${topupId}:`, err);
    }
  }

  async getUserTopUps(userId: string) {
    return this.prisma.topUp.findMany({
      where: { userId },
      include: {
        profile: {
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
        profile: {
          iccid: iccid
        }
      },
      include: {
        profile: {
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
        profile: {
          include: {
            order: true,
          },
        },
      },
    });
  }
}

