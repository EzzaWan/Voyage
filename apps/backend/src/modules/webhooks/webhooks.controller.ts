import { Controller, Post, Req, Res } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { OrdersService } from '../orders/orders.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Request, Response } from 'express';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly stripe: StripeService,
    private readonly ordersService: OrdersService,
    private readonly config: ConfigService,
  ) {}

  @Post('stripe')
  async stripeWebhook(@Req() req: Request, @Res() res: Response) {
    const raw = (req as any).rawBody;
    const sig = req.headers['stripe-signature'] as string;
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;
    try {
      event = this.stripe.stripe.webhooks.constructEvent(raw, sig, secret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.ordersService.handleStripePayment(session);
    }

    return res.json({ received: true });
  }
}
