import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { AffiliateService } from '../affiliate/affiliate.service';
import { AffiliateCommissionService } from '../affiliate/affiliate-commission.service';
import { AffiliateAnalyticsService } from '../affiliate/affiliate-analytics.service';
import { FraudDetectionService } from '../affiliate/fraud/fraud-detection.service';
import { Webhook } from 'svix';
import { EsimAccess, WebhookEvent } from '../../../../../libs/esim-access';

@Injectable()
export class WebhooksService {
  private esimAccess: EsimAccess;

  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private stripeService: StripeService,
    private prisma: PrismaService,
    private config: ConfigService,
    @Inject(forwardRef(() => AffiliateService))
    private affiliateService: AffiliateService,
    @Inject(forwardRef(() => AffiliateCommissionService))
    private commissionService?: AffiliateCommissionService,
    @Inject(forwardRef(() => AffiliateAnalyticsService))
    private analyticsService?: AffiliateAnalyticsService,
    @Inject(forwardRef(() => FraudDetectionService))
    private fraudDetection?: FraudDetectionService,
    // @InjectQueue('provisionQueue') private provisionQueue: Queue
  ) {
     this.esimAccess = new EsimAccess({
        accessCode: this.config.get('ESIM_ACCESS_CODE') || '',
        secretKey: this.config.get('ESIM_SECRET_KEY') || '',
        baseUrl: this.config.get('ESIM_API_BASE'),
     });
  }

  async handleStripeWebhook(signature: string, payload: Buffer) {
    const event = this.stripeService.constructEventFromPayload(signature, payload);
    if (!event) {
      throw new Error('Invalid signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId;
      
      if (orderId) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'paid' },
        });
        
        console.log(`Enqueued provision job for order ${orderId}`);
      }
    }

    // Handle refunds - reverse commissions
    if (event.type === 'charge.refunded' || event.type === 'payment_intent.canceled') {
      const charge = event.data.object as any;
      const orderId = charge.metadata?.orderId;
      
      if (orderId && this.commissionService) {
        this.logger.log(`[WEBHOOK] Processing refund for order ${orderId}`);
        
        // Reverse commission for order
        try {
          await this.commissionService.reverseCommission(orderId, 'order');
          
          // Update order status if needed
          await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'cancelled' },
          });
          
          this.logger.log(`[WEBHOOK] Reversed commission for refunded order ${orderId}`);
        } catch (error) {
          this.logger.error(`[WEBHOOK] Failed to reverse commission for order ${orderId}:`, error);
        }
      }
    }
  }

  async handleEsimWebhook(payload: any, headers: { signature?: string, timestamp?: string, requestId?: string, accessCode?: string }) {
    // Verify signature if headers present
    if (headers.signature && headers.timestamp && headers.requestId) {
        const isValid = this.esimAccess.webhooks.verifySignature(
            headers.signature,
            payload,
            headers.timestamp,
            headers.requestId
        );
        
        if (!isValid) {
            console.error('Invalid webhook signature');
            // throw new BadRequestException('Invalid signature');
        }
    }

    // Parse event
    const event = this.esimAccess.webhooks.parseWebhook(payload, headers);

    // Save webhook event
    await this.prisma.webhookEvent.create({
      data: {
        id: crypto.randomUUID(),
        source: 'esim-access',
        payload: payload,
      },
    });

    console.log('Enqueued eSIM webhook processing', event.notifyType);
  }

  async handleClerkWebhook(
    payload: Buffer,
    headers: { 'svix-id'?: string; 'svix-timestamp'?: string; 'svix-signature'?: string },
  ) {
    const webhookSecret = this.config.get<string>('CLERK_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.warn('[CLERK] CLERK_WEBHOOK_SECRET not set, skipping webhook verification');
      // In development, allow webhooks without secret
      // return;
    }

    try {
      // Verify webhook signature using Svix
      if (!webhookSecret) {
        throw new BadRequestException('CLERK_WEBHOOK_SECRET is required');
      }

      const wh = new Webhook(webhookSecret);
      // Convert Buffer to string for Svix verification
      const payloadString = payload instanceof Buffer ? payload.toString('utf8') : payload;
      const evt = wh.verify(payloadString, {
        'svix-id': headers['svix-id'] || '',
        'svix-timestamp': headers['svix-timestamp'] || '',
        'svix-signature': headers['svix-signature'] || '',
      }) as any;

      const eventType = evt.type;
      const data = evt.data;

      this.logger.log(`[CLERK] Webhook received: ${eventType}`);

      if (eventType === 'user.created') {
        // User signed up - create them in database
        const email = data.email_addresses?.[0]?.email_address;
        const firstName = data.first_name || null;
        const lastName = data.last_name || null;
        const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || null;

        if (!email) {
          this.logger.warn('[CLERK] User created but no email found', data);
          return;
        }

        // Create or update user
        const user = await this.prisma.user.upsert({
          where: { email },
          create: {
            id: crypto.randomUUID(),
            email,
            name,
          },
          update: {
            name: name || undefined, // Update name if provided
          },
        });

        this.logger.log(`[CLERK] Created/updated user in database: ${email}`);

        // Create affiliate record for new user
        try {
          await this.affiliateService.createAffiliateForUser(user.id);
          this.logger.log(`[CLERK] Created affiliate record for user: ${user.id}`);
        } catch (err) {
          this.logger.error(`[CLERK] Failed to create affiliate for user ${user.id}:`, err);
        }

        // Track affiliate signup if referral cookie exists (handled via frontend API call)
        // Frontend will call /api/affiliate/track-signup after user signs up
        // We can't access cookies in webhook, so this is handled separately
      } else if (eventType === 'user.updated') {
        // Update user data
        const email = data.email_addresses?.[0]?.email_address;
        if (!email) return;

        const firstName = data.first_name || null;
        const lastName = data.last_name || null;
        const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || null;

        await this.prisma.user.updateMany({
          where: { email },
          data: {
            name: name || undefined,
          },
        });

        this.logger.log(`[CLERK] Updated user in database: ${email}`);
      }
    } catch (err: any) {
      this.logger.error('[CLERK] Webhook verification failed:', err.message);
      throw new BadRequestException(`Webhook verification failed: ${err.message}`);
    }
  }
}
