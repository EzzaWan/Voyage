import { Injectable, BadRequestException } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { EsimAccess, WebhookEvent } from '../../../../../libs/esim-access';

@Injectable()
export class WebhooksService {
  private esimAccess: EsimAccess;

  constructor(
    private stripeService: StripeService,
    private prisma: PrismaService,
    private config: ConfigService,
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
        source: 'esim-access',
        payload: payload,
      },
    });

    console.log('Enqueued eSIM webhook processing', event.notifyType);
  }
}
