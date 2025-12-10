import {
  Controller,
  Get,
  Param,
  Post,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { OrdersService } from '../../orders/orders.service';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../../prisma.service';
import { UsageService } from '../../esim/usage.service';

@Controller('admin/esims')
@UseGuards(AdminGuard)
export class AdminEsimsController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
    private readonly usageService: UsageService,
  ) {}

  @Get()
  async getAllEsims(@Req() req: any) {
    const profiles = await this.prisma.esimProfile.findMany({
      include: {
        Order: {
          include: {
            User: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        User: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    return profiles.map((profile) => ({
      ...profile,
      totalVolume: profile.totalVolume ? profile.totalVolume.toString() : null,
      orderUsage: profile.orderUsage ? profile.orderUsage.toString() : null,
    }));
  }

  @Get(':id')
  async getEsim(@Param('id') id: string, @Req() req: any) {
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id },
      include: {
        Order: {
          include: {
            User: true,
          },
        },
        User: true,
        TopUp: {
          include: {
            User: {
              select: {
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`eSIM profile ${id} not found`);
    }

    const profileWithRelations = profile as any;

    return {
      id: profile.id,
      iccid: profile.iccid,
      esimTranNo: profile.esimTranNo,
      qrCodeUrl: profile.qrCodeUrl,
      ac: profile.ac,
      smdpStatus: profile.smdpStatus,
      esimStatus: profile.esimStatus,
      totalVolume: profile.totalVolume ? profile.totalVolume.toString() : null,
      orderUsage: profile.orderUsage ? profile.orderUsage.toString() : null,
      expiredTime: profile.expiredTime ? profile.expiredTime.toISOString() : null,
      order: profileWithRelations.Order ? {
        id: profileWithRelations.Order.id,
        planId: profileWithRelations.Order.planId,
        user: {
          email: profileWithRelations.Order.User.email,
          name: profileWithRelations.Order.User.name,
        },
      } : null,
      topups: (profileWithRelations.TopUp || []).map((topup: any) => ({
        id: topup.id,
        planCode: topup.planCode,
        amountCents: Number(topup.amountCents),
        status: topup.status,
        createdAt: topup.createdAt.toISOString(),
      })),
    };
  }

  @Post(':id/sync')
  async syncEsim(@Param('id') id: string, @Req() req: any) {
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id },
      include: {
        Order: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`eSIM profile ${id} not found`);
    }

    try {
      // Sync all profiles (including this one)
      await this.ordersService.syncEsimProfiles();

      // Log action
      await this.adminService.logAction(
        req.adminEmail,
        'sync_esim',
        'esim_profile',
        id,
        { profileId: id, iccid: profile.iccid },
      );

      return { success: true, message: 'eSIM sync completed' };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete(':id')
  async deleteEsim(@Param('id') id: string, @Req() req: any) {
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id },
      include: {
        TopUp: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`eSIM profile ${id} not found`);
    }

    // Check if profile has topups - warn but allow deletion
    if (profile.TopUp && profile.TopUp.length > 0) {
      // Delete topups first (they reference the profile)
      await this.prisma.topUp.deleteMany({
        where: { profileId: id },
      });
    }

    // Delete the profile
    await this.prisma.esimProfile.delete({
      where: { id },
    });

    // Log action
    await this.adminService.logAction(
      req.adminEmail,
      'delete_esim',
      'esim_profile',
      id,
      { profileId: id, iccid: profile.iccid, hadTopups: profile.TopUp?.length || 0 },
    );

    return { success: true, message: 'eSIM profile deleted successfully' };
  }

  @Post(':id/sync-usage')
  async syncUsage(@Param('id') id: string, @Req() req: any) {
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`eSIM profile ${id} not found`);
    }

    if (!profile.esimTranNo) {
      throw new BadRequestException('Profile has no esimTranNo');
    }

    try {
      await this.usageService.syncUsageForProfile(id, profile.esimTranNo);

      // Log action
      await this.adminService.logAction(
        req.adminEmail,
        'sync_usage',
        'esim_profile',
        id,
        { profileId: id, iccid: profile.iccid },
      );

      return { success: true, message: 'Usage synced successfully' };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':id/usage-history')
  async getUsageHistory(@Param('id') id: string, @Req() req: any) {
    const profile = await this.prisma.esimProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`eSIM profile ${id} not found`);
    }

    const history = await this.usageService.getUsageHistory(id, 100);

    return history.map((record) => ({
      id: record.id,
      profileId: record.profileId,
      usedBytes: record.usedBytes.toString(),
      recordedAt: record.recordedAt.toISOString(),
    }));
  }
}

