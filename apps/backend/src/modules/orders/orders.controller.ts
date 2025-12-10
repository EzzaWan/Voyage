import { Controller, Post, Body, Get, Param, NotFoundException, Res, Req, ForbiddenException, Headers, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma.service';
import { ReceiptService } from '../receipt/receipt.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('orders')
@UseGuards(RateLimitGuard, CsrfGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly receiptService: ReceiptService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @RateLimit({ limit: 5, window: 30 })
  async createOrder(
    @Body() body: {
      planCode: string;
      amount: number;
      currency: string;
      planName: string;
      displayCurrency?: string;
      referralCode?: string;
      paymentMethod?: 'stripe' | 'vcash';
    },
    @Req() req: any,
  ) {
    try {
      const paymentMethod = body.paymentMethod || 'stripe';
      
      // Validate required fields with detailed error messages
      if (!body.planCode) {
        throw new BadRequestException('Missing required field: planCode is required');
      }
      if (!body.planName) {
        throw new BadRequestException('Missing required field: planName is required');
      }
      if (body.amount === undefined || body.amount === null) {
        throw new BadRequestException('Missing required field: amount is required');
      }

      // Validate amount
      if (typeof body.amount !== 'number' || body.amount <= 0 || !isFinite(body.amount)) {
        throw new BadRequestException(`Invalid amount: ${body.amount}. Amount must be a positive number.`);
      }

      // Validate currency
      if (!body.currency) {
        throw new BadRequestException('Missing required field: currency is required');
      }
      
      // If V-Cash payment, we need user email from headers
      if (paymentMethod === 'vcash') {
        const email = req.headers['x-user-email'] as string;
        if (!email) {
          throw new NotFoundException('User email required for V-Cash payment');
        }
        return this.ordersService.createVCashOrder({ ...body, email });
      }
      
      // Default to Stripe checkout
      return await this.ordersService.createStripeCheckout(body);
    } catch (error) {
      // Log the error for debugging
      console.error('[CREATE_ORDER_ERROR]', error);
      // Re-throw to let the exception filter handle it
      throw error;
    }
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
        User: true,
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
    const isOwner = userEmail && order.User.email.toLowerCase() === userEmail.toLowerCase();

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
        User: true,
        EsimProfile: {
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
    if (order.EsimProfile && order.EsimProfile.length > 0) {
      const profile = order.EsimProfile[0];
      await this.ordersService.sendEsimReadyEmail(order, order.User, order.planId, profile);
      return { success: true, message: 'eSIM ready and receipt email sent' };
    } else {
      await this.ordersService.sendReceiptEmail(order, order.User, order.planId);
      return { success: true, message: 'Receipt email sent' };
    }
  }

  private async checkIfAdmin(adminEmail: string | undefined): Promise<boolean> {
    if (!adminEmail) {
      return false;
    }

    const normalizedEmail = adminEmail.toLowerCase();

    // First, try to get admin emails from database (via AdminSettingsService)
    // Note: This is a simple check - for production, you might want to inject AdminSettingsService
    // For now, we'll check env vars as fallback
    let allowedEmails: string[] = [];
    
    // Try to use AdminSettingsService if available
    try {
      // We can't inject AdminSettingsService here due to circular dependencies potentially
      // So we'll check env vars, but AdminGuard will handle the database check for protected routes
      allowedEmails = this.configService
        .get<string>('ADMIN_EMAILS', '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    } catch (error) {
      // Fallback
      allowedEmails = [];
    }

    return allowedEmails.includes(normalizedEmail);
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
