import { Controller, Post, Req, Headers, BadRequestException } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { OrdersService } from '../orders/orders.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly stripe: StripeService,
    private readonly ordersService: OrdersService,
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
        await this.ordersService.handleStripePayment(event.data.object);
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
