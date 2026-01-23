import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
  ) {}

  @Get('search')
  async searchUser(@Query('email') email: string, @Req() req: any) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  @Get()
  async getAllUsers(@Req() req: any) {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            Order: true,
            EsimProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      orderCount: user._count.Order,
      esimCount: user._count.EsimProfile,
    }));
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        Order: {
          include: {
            EsimProfile: {
              select: {
                id: true,
                iccid: true,
                esimTranNo: true,
                esimStatus: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        EsimProfile: {
          orderBy: {
            id: 'desc',
          },
        },
        TopUp: {
          include: {
            EsimProfile: {
              select: {
                id: true,
                iccid: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const userWithRelations = user as any;

    return {
      ...user,
      orders: (userWithRelations.Order || []).map((order: any) => ({
        id: order.id,
        planId: order.planId,
        amountCents: Number(order.amountCents),
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
      profiles: (userWithRelations.EsimProfile || []).map((profile: any) => ({
        id: profile.id,
        iccid: profile.iccid,
        esimStatus: profile.esimStatus,
      })),
      topups: (userWithRelations.TopUp || []).map((topup: any) => ({
        id: topup.id,
        planCode: topup.planCode,
        amountCents: Number(topup.amountCents),
        status: topup.status,
        createdAt: topup.createdAt.toISOString(),
      })),
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        Order: {
          select: {
            id: true,
            status: true,
          },
        },
        EsimProfile: {
          select: {
            id: true,
          },
        },
        TopUp: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    // Check if user has any completed orders (safety check)
    const hasCompletedOrders = user.Order.some(
      (order) => order.status === 'paid' || order.status === 'active' || order.status === 'esim_created'
    );

    if (hasCompletedOrders) {
      throw new BadRequestException(
        'Cannot delete user with completed orders. Please delete or refund orders first.'
      );
    }

    try {
      // Delete related records in correct order (respecting foreign key constraints)
      
      // 1. Delete commissions related to user's orders
      const orderIds = user.Order.map((o) => o.id);
      await this.prisma.commission.deleteMany({
        where: {
          orderId: { in: orderIds },
        },
      });

      // 2. Delete topups (they reference EsimProfile, so delete before profiles)
      await this.prisma.topUp.deleteMany({
        where: {
          userId: id,
        },
      });

      // 3. Delete eSIM profiles
      await this.prisma.esimProfile.deleteMany({
        where: {
          userId: id,
        },
      });

      // 4. Delete orders
      await this.prisma.order.deleteMany({
        where: {
          userId: id,
        },
      });

      // 5. Delete referral (if user was referred)
      await this.prisma.referral.deleteMany({
        where: {
          referredUserId: id,
        },
      });

      // 6. Delete affiliate record (if user is an affiliate)
      await this.prisma.affiliate.deleteMany({
        where: {
          userId: id,
        },
      });

      // 7. Delete V-Cash balance and transactions
      await this.prisma.vCashTransaction.deleteMany({
        where: {
          userId: id,
        },
      });
      await this.prisma.vCashBalance.deleteMany({
        where: {
          userId: id,
        },
      });

      // 8. Delete reviews
      await this.prisma.review.deleteMany({
        where: {
          userId: id,
        },
      });

      // 9. Delete mobile tokens
      await this.prisma.mobileToken.deleteMany({
        where: {
          userId: id,
        },
      });

      // 10. Delete affiliate signup (if exists)
      await this.prisma.affiliateSignup.deleteMany({
        where: {
          userId: id,
        },
      });

      // 11. Finally, delete the user
      await this.prisma.user.delete({
        where: { id },
      });

      // Log admin action
      await this.adminService.logAction(
        req.adminEmail,
        'delete_user',
        'user',
        id,
        { userId: id, email: user.email, orderCount: user.Order.length },
      );

      return { success: true, message: 'User deleted successfully' };
    } catch (error: any) {
      throw new BadRequestException(`Failed to delete user: ${error.message}`);
    }
  }
}

