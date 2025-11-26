import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService
  ) {}

  async createOrder(data: {
    planId: string;
    userId: string;
    amountCents: number;
    currency: string;
  }) {
    // Create local order
    const order = await this.prisma.order.create({
      data: {
        planId: data.planId,
        userId: data.userId,
        amountCents: data.amountCents,
        currency: data.currency,
        status: 'pending',
        paymentMethod: 'stripe', // default
      },
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      data.amountCents,
      data.currency,
      { orderId: order.id }
    );

    return {
      order,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async getOrder(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        profiles: true 
      }
    });
  }
}
