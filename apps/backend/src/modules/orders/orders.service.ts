import { Injectable } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class OrdersService {
  constructor(
    private stripe: StripeService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

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
    const planCode = session.metadata?.planCode;

    // Assuming a user exists or using a placeholder logic as requested
    // Ideally we find the user via email from session.customer_details.email
    // For now, create a placeholder profile directly as per prompt instructions
    // But we need an order to link to for the schema.
    
    // Strategy: Create Order -> Create Profile
    // Use transaction ID as reference
    
    // 1. Create Order
    // We need a userId. Let's see if we can find one or use a default.
    // Assuming schema requires valid user.
    // We'll use a placeholder user or try to find by email if available in session
    const email = session.customer_details?.email || 'guest@voyage.app';
    
    const user = await this.prisma.user.upsert({
        where: { email },
        create: { email, name: session.customer_details?.name || 'Guest' },
        update: {}
    });

    const order = await this.prisma.order.create({
        data: {
            userId: user.id,
            planId: planCode || 'unknown',
            amountCents: session.amount_total || 0,
            currency: session.currency || 'usd',
            status: 'paid',
            paymentMethod: 'stripe',
            paymentRef: session.payment_intent as string,
            esimOrderNo: `PENDING-${session.id}` 
        }
    });

    // 2. Create Profile Placeholder (as per prompt)
    await this.prisma.esimProfile.create({
      data: {
        orderId: order.id,
        userId: user.id,
        // planId removed as it is not in schema
        esimTranNo: `MOCK-${Date.now()}`,
        iccid: "DUMMY-ICCID",
        esimStatus: "active",
      },
    });
  }
}
