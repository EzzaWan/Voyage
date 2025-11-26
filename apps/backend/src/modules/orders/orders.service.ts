import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { EsimService } from '../esim/esim.service';

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
    const webUrl = this.config.get('WEB_URL') || 'http://localhost:3000';

    const session = await this.stripe.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount,
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

    const transactionId = `stripe_${session.id}_${order.id}`;
    const packageInfoList = [
      {
        packageCode: planCode,
        count: 1,
      },
    ];

    const body = {
      transactionId,
      packageInfoList,
      amount: session.amount_total ?? 0,
    };

    let esimResult: any = null;
    try {
      esimResult = await this.esimService.sdk.client.request(
        'POST',
        '/esim/order',
        body
      );
    } catch (err) {
      this.logger.error('ESIM ORDER FAILED', err);
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'esim_order_failed' },
      });
      return;
    }

    const orderNo = esimResult?.obj?.orderNo;
    if (!orderNo) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'esim_no_orderno' },
      });
      return;
    }

    const pollQuery = async (attempts = 10, delayMs = 3000) => {
      for (let i = 0; i < attempts; i++) {
        try {
          const res = await this.esimService.sdk.client.request(
            'POST',
            '/esim/query',
            { orderNo, pager: { pageNum: 1, pageSize: 50 } }
          );

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
        totalDuration: profile.totalDuration ?? null,
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        esimOrderNo: orderNo,
        status: 'esim_created',
      },
    });

    this.logger.log(`Created REAL eSIM profile for order ${order.id}`);
  }
}
