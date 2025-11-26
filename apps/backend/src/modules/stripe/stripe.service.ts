import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private config: ConfigService) {
    const secret = this.config.get('STRIPE_SECRET');
    if (secret) {
      this.stripe = new Stripe(secret, {
        apiVersion: '2023-10-16', // use a specific version
      });
    }
  }

  async createPaymentIntent(amountCents: number, currency: string, metadata: any) {
    if (!this.stripe) {
       console.warn('Stripe secret not set');
       return { client_secret: 'mock_secret' };
    }
    return this.stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  constructEventFromPayload(signature: string, payload: Buffer) {
    if (!this.stripe) return null;
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET')
    );
  }
}

