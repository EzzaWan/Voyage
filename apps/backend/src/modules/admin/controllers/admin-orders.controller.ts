import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { OrdersService } from '../../orders/orders.service';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/orders')
@UseGuards(AdminGuard)
export class AdminOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getAllOrders(@Req() req: any) {
    const orders = await this.prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        profiles: {
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
        user: true,
        profiles: true,
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

    return {
      ...order,
      amountCents: Number(order.amountCents),
      webhookEvents,
    };
  }

  @Post(':id/retry')
  async retryOrder(@Param('id') id: string, @Req() req: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        profiles: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // Check if order is already successfully created
    if (order.status === 'esim_created' && order.profiles && order.profiles.length > 0) {
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
        order.user,
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
        profiles: true,
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
        { orderId: id, profileCount: order.profiles.length },
      );

      return { success: true, message: 'Order sync completed' };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

