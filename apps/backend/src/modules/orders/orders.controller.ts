import { Controller, Post, Body, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() body: {
    planCode: string;
    amount: number;
    currency: string;
    planName: string;
  }) {
    return this.ordersService.createStripeCheckout(body);
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
