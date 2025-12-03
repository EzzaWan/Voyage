import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async createOrder(@Body() body: {
    planCode: string;
    amount: number;
    currency: string;
    planName: string;
  }) {
    return this.ordersService.createStripeCheckout(body);
  }

  @Post(':id/resend-receipt')
  async resendReceipt(@Param('id') id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // Resend order confirmation email
    await this.ordersService.sendOrderConfirmationEmail(order, order.user, order.planId);

    return { success: true, message: 'Receipt email sent' };
  }

  // ============================================
  // FEATURE 5: MANUAL TRIGGER ENDPOINTS
  // ============================================
  @Get('retry-now')
  async retryNow() {
    await this.ordersService.retryPendingOrders();
    return { message: 'Retry cycle completed', timestamp: new Date().toISOString() };
  }
}
