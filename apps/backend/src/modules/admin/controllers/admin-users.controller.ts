import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAllUsers(@Req() req: any) {
    const users = await this.prisma.user.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            profiles: true,
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
      orderCount: user._count.orders,
      esimCount: user._count.profiles,
    }));
  }

  @Get(':id')
  async getUser(@Param('id') id: string, @Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            profiles: {
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
        profiles: {
          orderBy: {
            id: 'desc',
          },
        },
        topups: {
          include: {
            profile: {
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
      orders: userWithRelations.orders?.map((order: any) => ({
        ...order,
        amountCents: Number(order.amountCents),
      })) || [],
      topups: userWithRelations.topups?.map((topup: any) => ({
        ...topup,
        amountCents: Number(topup.amountCents),
      })) || [],
    };
  }
}

