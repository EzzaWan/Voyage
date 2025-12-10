import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { OrdersService } from '../../orders/orders.service';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../../prisma.service';
import { VCashService } from '../../vcash/vcash.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';
import { SecurityLoggerService } from '../../../common/services/security-logger.service';
import { StripeService } from '../../stripe/stripe.service';
import { AffiliateCommissionService } from '../../affiliate/affiliate-commission.service';
import { getClientIp } from '../../../common/utils/webhook-ip-whitelist';

@Controller('admin/orders')
@UseGuards(AdminGuard)
export class AdminOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
    private readonly vcashService: VCashService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly securityLogger: SecurityLoggerService,
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => AffiliateCommissionService))
    private readonly commissionService?: AffiliateCommissionService,
  ) {}

  @Get()
  async getAllOrders(@Req() req: any) {
    const orders = await this.prisma.order.findMany({
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        EsimProfile: {
          select: {
            id: true,
            iccid: true,
            esimTranNo: true,
            esimStatus: true,
            smdpStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => ({
      ...order,
      amountCents: Number(order.amountCents),
    }));
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @Req() req: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        User: true,
        EsimProfile: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // Get webhook events related to this order
    const webhookEvents = await this.prisma.webhookEvent.findMany({
      where: {
        OR: [
          {
            payload: {
              path: ['metadata', 'orderId'],
              equals: id,
            },
          },
          {
            payload: {
              path: ['data', 'object', 'metadata', 'orderId'],
              equals: id,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const orderWithRelations = order as any;

    return {
      id: order.id,
      planId: order.planId,
      amountCents: Number(order.amountCents),
      currency: order.currency,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentRef: order.paymentRef,
      esimOrderNo: order.esimOrderNo,
      createdAt: order.createdAt.toISOString(),
      user: {
        id: orderWithRelations.User.id,
        email: orderWithRelations.User.email,
        name: orderWithRelations.User.name,
      },
      profiles: (orderWithRelations.EsimProfile || []).map((profile: any) => ({
        id: profile.id,
        iccid: profile.iccid,
        esimTranNo: profile.esimTranNo,
        esimStatus: profile.esimStatus,
        smdpStatus: profile.smdpStatus,
      })),
      webhookEvents: (webhookEvents || []).map((event: any) => ({
        id: event.id,
        source: event.source,
        payload: event.payload,
        processed: event.processed,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }

  @Post(':id/retry')
  async retryOrder(@Param('id') id: string, @Req() req: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        User: true,
        EsimProfile: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // Check if order is already successfully created
    if (order.status === 'esim_created' && order.EsimProfile && order.EsimProfile.length > 0) {
      return {
        success: false,
        error: 'Order already has eSIM profile(s) created. Use Sync instead to update status.',
        warning: true,
      };
    }

    try {
      // Retry provisioning
      await this.ordersService.performEsimOrderForOrder(
        order,
        order.User,
        order.planId,
        undefined as any,
      );

      // Log action
      await this.adminService.logAction(
        req.adminEmail,
        'retry_order',
        'order',
        id,
        { orderId: id, planId: order.planId },
      );

      return { success: true, message: 'Order retry initiated' };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post(':id/sync')
  async syncOrder(@Param('id') id: string, @Req() req: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        EsimProfile: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    try {
      // Sync all profiles for this order
      await this.ordersService.syncEsimProfiles();

      // Log action
      await this.adminService.logAction(
        req.adminEmail,
        'sync_order',
        'order',
        id,
        { orderId: id, profileCount: order.EsimProfile.length },
      );

      return { success: true, message: 'Order sync completed' };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refund an order
   * Supports both card refund (via Stripe) and V-Cash refund
   */
  @Post(':id/refund')
  async refundOrder(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { refundMethod?: 'card' | 'vcash'; amountCents?: number },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        User: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (order.status === 'cancelled' || order.refundedAt) {
      throw new BadRequestException('Order already refunded or cancelled');
    }

    const refundMethod = body.refundMethod || 'card';
    const refundAmountCents = body.amountCents || order.amountCents;
    const ip = getClientIp(req);

    if (refundMethod === 'vcash') {
      // Get plan name for better transaction history
      const plan = await this.prisma.plan.findUnique({
        where: { id: order.planId },
        select: { name: true },
      });

      // Refund as V-Cash
      await this.vcashService.credit(
        order.userId,
        refundAmountCents,
        'refund',
        { orderId: order.id, planName: plan?.name || order.planId },
        ip,
      );

      // Update order
      await this.prisma.order.update({
        where: { id },
        data: {
          refundMethod: 'vcash',
          refundAmountCents,
          refundedAt: new Date(),
          status: 'cancelled',
        },
      });

      // Reverse commission if exists (for V-Cash refunds, we handle it here)
      if (this.commissionService) {
        try {
          await this.commissionService.reverseCommission(order.id, 'order');
        } catch (error) {
          console.error('Failed to reverse commission:', error);
        }
      }

      // Log security event
      await this.securityLogger.logSecurityEvent({
        type: 'ORDER_REFUND_VCASH' as any,
        userId: order.userId,
        ip,
        details: {
          orderId: order.id,
          refundAmountCents,
          adminEmail: req.adminEmail,
        },
      });

      // Send email
      if (this.emailService) {
        try {
          const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
          const vcashBalance = await this.vcashService.getBalance(order.userId);
          await this.emailService.sendRefundToVCashEmail(
            order.User.email,
            {
              orderId: order.id,
              refundAmountFormatted: `$${(refundAmountCents / 100).toFixed(2)}`,
              vcashBalanceFormatted: `$${(vcashBalance / 100).toFixed(2)}`,
              vcashBalanceCents: vcashBalance,
              dashboardUrl: `${webUrl}/account/vcash`,
            },
          );
        } catch (error) {
          console.error('Failed to send refund email:', error);
        }
      }

      // Log admin action
      await this.adminService.logAction(
        req.adminEmail,
        'refund_order_vcash',
        'order',
        id,
        { orderId: id, refundAmountCents },
      );

      return {
        success: true,
        message: `Order refunded as V-Cash: $${(refundAmountCents / 100).toFixed(2)}`,
        refundMethod: 'vcash',
        refundAmountCents,
      };
    } else {
      // Refund to card via Stripe
      if (!order.paymentRef) {
        throw new BadRequestException('Order has no payment reference for card refund');
      }

      try {
        // Process Stripe refund
        await this.stripeService.refundPayment(order.paymentRef, refundAmountCents);

        // Update order
        await this.prisma.order.update({
          where: { id },
          data: {
            refundMethod: 'card',
            refundAmountCents,
            refundedAt: new Date(),
            status: 'cancelled',
          },
        });

        // Reverse commission if exists (handled by webhook when Stripe refund event is received)
        // Commission reversal is handled via webhook when Stripe refund event is received

        // Log admin action
        await this.adminService.logAction(
          req.adminEmail,
          'refund_order_card',
          'order',
          id,
          { orderId: id, refundAmountCents },
        );

        return {
          success: true,
          message: `Order refunded to card: $${(refundAmountCents / 100).toFixed(2)}`,
          refundMethod: 'card',
          refundAmountCents,
        };
      } catch (error: any) {
        throw new BadRequestException(`Stripe refund failed: ${error.message}`);
      }
    }
  }
}

