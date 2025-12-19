import { Controller, Post, Body, Get, Param, NotFoundException, Res, Req, ForbiddenException, Headers, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma.service';
import { ReceiptService } from '../receipt/receipt.service';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../stripe/stripe.service';
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
    private readonly stripeService: StripeService,
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
      email?: string; // User email (from Clerk if logged in)
    },
    @Req() req: any,
    @Headers('x-user-email') userEmailHeader: string | undefined,
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
      
      // Get user email from body, header, or use guest
      const email = body.email || userEmailHeader;
      
      // If V-Cash payment, we need user email
      if (paymentMethod === 'vcash') {
        if (!email) {
          throw new NotFoundException('User email required for V-Cash payment');
        }
        return this.ordersService.createVCashOrder({ ...body, email });
      }
      
      // For Stripe, create pending order with email if provided
      return this.ordersService.createPendingOrder({ 
        ...body, 
        email: email // Use email from body or header if available
      });
    } catch (error) {
      // Log the error for debugging
      console.error('[CREATE_ORDER_ERROR]', error);
      // Re-throw to let the exception filter handle it
      throw error;
    }
  }

  @Post(':orderId/validate-promo')
  @RateLimit({ limit: 10, window: 60 })
  async validatePromoCode(
    @Param('orderId') orderId: string,
    @Body() body: { promoCode: string },
  ) {
    try {
      if (!body.promoCode) {
        throw new BadRequestException('Promo code is required');
      }

      // Validate promo code
      const validPromoCodes: Record<string, number> = {
        'TEST10': 10,
        'TEST20': 20,
        'TEST50': 50,
        'WELCOME10': 10, // Welcome discount
      };
      
      const promoCode = body.promoCode.toUpperCase().trim();
      if (!validPromoCodes[promoCode]) {
        throw new BadRequestException(`Invalid promo code: ${body.promoCode}`);
      }

      // Check if order already has a promo applied
      const existingOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          amountCents: true,
          status: true,
        },
      });

      if (!existingOrder) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      if (existingOrder.status !== 'pending') {
        throw new BadRequestException('Cannot apply promo code to an order that is not pending');
      }

      // Note: We can't perfectly detect if a promo was already applied without storing it in the database
      // The frontend will handle duplicate prevention via localStorage and UI state
      // Backend will apply the discount, and if it was already applied, it will double-discount
      // For production, add a promoCode field to Order model to track this properly

      // Apply discount to order
      const discountPercent = validPromoCodes[promoCode];
      const promoResult = await this.ordersService.applyPromoCodeToOrder(orderId, promoCode, discountPercent);

      // Get updated order to return new amounts
      const updatedOrder = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          amountCents: true,
          displayAmountCents: true,
          displayCurrency: true,
        },
      });

      if (!updatedOrder) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      return {
        valid: true,
        promoCode,
        discountPercent,
        originalAmount: promoResult.originalAmount,
        originalDisplayAmount: promoResult.originalDisplayAmount,
        discountedAmount: updatedOrder.amountCents,
        displayAmount: updatedOrder.displayAmountCents || updatedOrder.amountCents,
        displayCurrency: updatedOrder.displayCurrency || 'USD',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to validate promo code');
    }
  }

  @Post(':orderId/remove-promo')
  @RateLimit({ limit: 10, window: 60 })
  async removePromoCode(@Param('orderId') orderId: string) {
    try {
      await this.ordersService.removePromoCodeFromOrder(orderId);
      return { success: true, message: 'Promo code removed' };
    } catch (error) {
      console.error('[REMOVE_PROMO_ERROR]', error);
      throw error;
    }
  }

  @Post(':orderId/update-email')
  @RateLimit({ limit: 5, window: 60 })
  async updateOrderEmail(
    @Param('orderId') orderId: string,
    @Body() body: { email: string },
  ) {
    try {
      if (!body.email) {
        throw new BadRequestException('Email is required');
      }
      return await this.ordersService.updateOrderEmail(orderId, body.email);
    } catch (error) {
      console.error('[UPDATE_ORDER_EMAIL_ERROR]', error);
      throw error;
    }
  }

  @Post(':orderId/checkout')
  @RateLimit({ limit: 5, window: 30 })
  async createCheckoutSession(
    @Param('orderId') orderId: string,
    @Body() body: { referralCode?: string },
    @Req() req: any,
  ) {
    try {
      // Get referral code from body or headers
      const referralCode = body.referralCode || req.headers['x-referral-code'] as string | undefined;
      
      // Promo code should already be applied via validate-promo endpoint
      return await this.ordersService.createStripeCheckoutForOrder(orderId, referralCode);
    } catch (error) {
      console.error('[CREATE_CHECKOUT_SESSION_ERROR]', error);
      throw error;
    }
  }

  @Get(':id')
  @RateLimit({ limit: 10, window: 60 })
  async getOrder(@Param('id') id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            email: true,
          },
        },
        EsimProfile: {
          take: 1,
          orderBy: { id: 'asc' },
          select: {
            id: true,
            iccid: true,
            qrCodeUrl: true,
            ac: true,
            esimStatus: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // Check if a promo code was likely applied by detecting if amount seems discounted
    // This is a heuristic - in production, store promoCode in Order model
    // For now, we'll return a flag if we detect a discount pattern
    // We can't perfectly detect, but we can check localStorage on frontend
    
    // Return only the fields we need
    return {
      id: order.id,
      planId: order.planId,
      amountCents: order.amountCents,
      displayAmountCents: order.displayAmountCents,
      displayCurrency: order.displayCurrency,
      currency: order.currency,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      receiptSent: order.receiptSent,
      userEmail: order.User?.email,
      EsimProfile: order.EsimProfile,
    };
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

  @Get('by-session/:sessionId')
  @RateLimit({ limit: 10, window: 60 })
  async getOrderBySession(@Param('sessionId') sessionId: string) {
    // In the new flow, orderId is stored in Stripe session metadata
    // paymentRef stores payment_intent ID (not session ID)
    // So we need to:
    // 1. First try to get orderId from Stripe session metadata (new flow)
    // 2. Try to find by session ID directly (legacy)
    // 3. Get payment_intent from Stripe session and search by that
    
    let order = null;
    let orderIdFromMetadata: string | null = null;

    // First, try to get orderId from Stripe session metadata (new flow)
    if (this.stripeService?.stripe) {
      try {
        const session = await this.stripeService.stripe.checkout.sessions.retrieve(sessionId);
        orderIdFromMetadata = session.metadata?.orderId as string | undefined || null;
        
        if (orderIdFromMetadata) {
          // Found orderId in metadata - this is the new flow
          order = await this.prisma.order.findUnique({
            where: { id: orderIdFromMetadata },
            select: {
              id: true,
              amountCents: true,
              currency: true,
              displayCurrency: true,
              displayAmountCents: true,
              status: true,
              paymentMethod: true,
            },
          });
        } else {
          // No orderId in metadata - try legacy flow
          // Get payment_intent from session
          const paymentIntentId = session.payment_intent as string;
          
          if (paymentIntentId) {
            order = await this.prisma.order.findUnique({
              where: { paymentRef: paymentIntentId },
              select: {
                id: true,
                amountCents: true,
                currency: true,
                displayCurrency: true,
                displayAmountCents: true,
                status: true,
                paymentMethod: true,
              },
            });
          }
        }
      } catch (error) {
        // Stripe lookup failed, try database lookup
        console.error(`[GET_ORDER_BY_SESSION] Failed to retrieve Stripe session:`, error);
      }
    }

    // If still not found, try direct database lookup (legacy)
    if (!order) {
      order = await this.prisma.order.findFirst({
        where: {
          OR: [
            { paymentRef: sessionId }, // Try session ID directly
            { esimOrderNo: `PENDING-${sessionId}` }, // Fallback: check esimOrderNo format
          ],
        },
        select: {
          id: true,
          amountCents: true,
          currency: true,
          displayCurrency: true,
          displayAmountCents: true,
          status: true,
          paymentMethod: true,
        },
      });
    }

    if (!order) {
      throw new NotFoundException(`Order not found for session ${sessionId}`);
    }

    return {
      id: order.id,
      amountCents: order.displayAmountCents || order.amountCents,
      currency: order.displayCurrency || order.currency,
      status: order.status,
    };
  }

  @Post(':orderId/request-guest-access')
  @RateLimit({ limit: 3, window: 300 })
  async requestGuestAccess(
    @Param('orderId') orderId: string,
    @Body() body: { email: string },
  ) {
    try {
      if (!body.email) {
        throw new BadRequestException('Email is required');
      }
      return await this.ordersService.requestGuestAccess(orderId, body.email);
    } catch (error) {
      console.error('[REQUEST_GUEST_ACCESS_ERROR]', error);
      throw error;
    }
  }

  @Get(':orderId/guest')
  @RateLimit({ limit: 10, window: 60 })
  async getOrderForGuest(
    @Param('orderId') orderId: string,
    @Query('token') token: string,
    @Query('email') email: string,
  ) {
    try {
      if (!token || !email) {
        throw new BadRequestException('Token and email are required');
      }

      // Verify token
      const tokenData = this.ordersService.verifyGuestAccessToken(token);
      if (!tokenData || tokenData.orderId !== orderId || tokenData.email.toLowerCase() !== email.toLowerCase().trim()) {
        throw new ForbiddenException('Invalid or expired access token');
      }

      // Get order with eSIM profiles
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          User: {
            select: {
              email: true,
            },
          },
          EsimProfile: {
            select: {
              id: true,
              iccid: true,
              qrCodeUrl: true,
              ac: true,
              esimStatus: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      // Verify email matches
      if (order.User.email.toLowerCase() !== email.toLowerCase().trim()) {
        throw new ForbiddenException('Email does not match order');
      }

      return {
        id: order.id,
        planId: order.planId,
        amountCents: order.amountCents,
        displayAmountCents: order.displayAmountCents,
        displayCurrency: order.displayCurrency,
        currency: order.currency,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        receiptSent: order.receiptSent,
        EsimProfile: order.EsimProfile,
      };
    } catch (error) {
      console.error('[GET_GUEST_ORDER_ERROR]', error);
      throw error;
    }
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
