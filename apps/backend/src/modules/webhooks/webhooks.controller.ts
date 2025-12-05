import { Controller, Post, Req, Headers, BadRequestException, Inject, forwardRef, UseGuards } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { OrdersService } from '../orders/orders.service';
import { TopUpService } from '../topup/topup.service';
import { WebhooksService } from './webhooks.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { validateWebhookIp } from '../../common/utils/webhook-ip-whitelist';

@Controller('webhooks')
@UseGuards(RateLimitGuard)
export class WebhooksController {
  constructor(
    private readonly stripe: StripeService,
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => TopUpService))
    private readonly topUpService: TopUpService,
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  @Post('stripe')
  @RateLimit({ limit: 20, window: 1 })
  async handleStripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    // Validate IP whitelist if configured
    const allowedIps = this.config
      .get<string>('ALLOWED_WEBHOOK_IPS', '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);
    
    if (allowedIps.length > 0) {
      validateWebhookIp(req, allowedIps);
    }

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

  @Post('esim')
  @RateLimit({ limit: 30, window: 1 })
  async handleEsimWebhook(
    @Req() req: any,
    @Headers('rt-signature') signature: string | undefined,
    @Headers('rt-timestamp') timestamp: string | undefined,
    @Headers('rt-request-id') requestId: string | undefined,
    @Headers('rt-access-code') accessCode: string | undefined,
  ) {
    // Validate IP whitelist if configured
    const allowedIps = this.config
      .get<string>('ALLOWED_WEBHOOK_IPS', '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);
    
    if (allowedIps.length > 0) {
      validateWebhookIp(req, allowedIps);
    }

    const raw = req.rawBody;
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;

    try {
      await this.webhooksService.handleEsimWebhook(payload, {
        signature,
        timestamp,
        requestId,
        accessCode,
      });
    } catch (err: any) {
      console.error('❌ eSIM webhook error:', err.message);
      throw new BadRequestException(err.message);
    }

    return { received: true };
  }

  @Post('clerk')
  async handleClerkWebhook(
    @Req() req: any,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const raw = req.rawBody;

    try {
      await this.webhooksService.handleClerkWebhook(
        raw,
        {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        },
      );
    } catch (err: any) {
      console.error("❌ Clerk webhook error:", err.message);
      throw new BadRequestException(err.message);
    }

    return { received: true };
  }
}
