import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class StripeService {
  public stripe: Stripe;

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(config.get("STRIPE_SECRET") || "", {
      apiVersion: "2023-10-16",
    });
  }

  constructEventFromPayload(signature: string, payload: Buffer) {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.get('STRIPE_WEBHOOK_SECRET')
    );
  }

  async refundPayment(paymentIntentId: string, amountCents: number): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountCents,
    });
  }
}
