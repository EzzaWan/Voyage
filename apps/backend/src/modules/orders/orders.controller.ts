import { Controller, Post, Body, Get, Param, NotFoundException, Res, Req, ForbiddenException, Headers, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma.service';
import { ReceiptService } from '../receipt/receipt.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly receiptService: ReceiptService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async createOrder(@Body() body: {
    planCode: string;
    amount: number;
    currency: string;
    planName: string;
    displayCurrency?: string;
    referralCode?: string;
  }) {
    return this.ordersService.createStripeCheckout(body);
  }

  @Get(':id/receipt')
  async downloadReceipt(
    @Param('id') id: string,
    @Headers('x-user-email') userEmailHeader: string | undefined,
    @Headers('x-admin-email') adminEmailHeader: string | undefined,
    @Query('email') userEmailQuery: string | undefined,
    @Res() res: Response,
  ) {
    // Fetch order
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // Get user email from header or query param (for email links)
    const userEmail = userEmailHeader || userEmailQuery;
    const adminEmail = adminEmailHeader;

    // Security check: verify user owns the order OR is admin
    const isAdmin = await this.checkIfAdmin(adminEmail);
    const isOwner = userEmail && order.user.email.toLowerCase() === userEmail.toLowerCase();

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Access denied. You must be the order owner or an admin.');
    }

    // Generate PDF receipt
    const pdfBuffer = await this.receiptService.generateReceipt(id);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    // Send PDF
    res.send(pdfBuffer);
  }

  @Post(':id/resend-receipt')
  async resendReceipt(@Param('id') id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        profiles: {
          take: 1, // Just get the first profile if it exists
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // If eSIM profile exists, send combined eSIM ready + receipt email (same as original)
    // Otherwise, send receipt-only email
    if (order.profiles && order.profiles.length > 0) {
      const profile = order.profiles[0];
      await this.ordersService.sendEsimReadyEmail(order, order.user, order.planId, profile);
      return { success: true, message: 'eSIM ready and receipt email sent' };
    } else {
      await this.ordersService.sendReceiptEmail(order, order.user, order.planId);
      return { success: true, message: 'Receipt email sent' };
    }
  }

  private async checkIfAdmin(adminEmail: string | undefined): Promise<boolean> {
    if (!adminEmail) {
      return false;
    }

    const allowedEmails = this.configService
      .get<string>('ADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    return allowedEmails.includes(adminEmail.toLowerCase());
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
