import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/topups')
@UseGuards(AdminGuard)
export class AdminTopupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAllTopups(@Req() req: any) {
    const topups = await this.prisma.topUp.findMany({
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return topups.map((topup) => ({
      ...topup,
      amountCents: Number(topup.amountCents),
    }));
  }
}

