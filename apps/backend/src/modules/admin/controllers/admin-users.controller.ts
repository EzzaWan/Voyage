import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

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

