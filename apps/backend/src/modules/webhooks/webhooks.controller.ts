import { Controller, Post, Req, Headers, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { OrdersService } from '../orders/orders.service';
import { TopUpService } from '../topup/topup.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly stripe: StripeService,
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => TopUpService))
    private readonly topUpService: TopUpService,
    private readonly config: ConfigService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const raw = req.rawBody;

    let event;

    try {
      event = this.stripe.stripe.webhooks.constructEvent(
        raw,
        signature,
        this.config.get<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err: any) {
      console.error("❌ Signature verification failed:", err.message);
      throw new BadRequestException(err.message);
    }

    console.log("🔥 Webhook received:", event.type);

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this is a topup webhook
        if (session.metadata?.type === 'topup') {
          await this.topUpService.handleStripeTopUp(session);
        } else {
          // Regular order payment
          await this.ordersService.handleStripePayment(session);
        }
      }

      if (event.type === 'payment_intent.succeeded' || event.type === 'charge.succeeded') {
        const obj = event.data.object as any;
        const ref =
          obj.id ||
          obj.payment_intent ||
          obj.payment_intent?.id ||
          obj.checkout_session ||
          obj.session_id;

        if (ref) {
          await this.ordersService.retryPendingForPaymentRef(ref);
        }
      }
    } catch (err) {
      console.error('Webhook handling error:', err);
      throw err;
    }

    return { received: true };
  }
}
