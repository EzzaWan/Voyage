import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AffiliateService } from '../../affiliate/affiliate.service';
import { PrismaService } from '../../../prisma.service';

@Controller('admin/affiliates')
@UseGuards(AdminGuard)
export class AdminAffiliatesController {
  constructor(
    private readonly affiliateService: AffiliateService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getAllAffiliates(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.affiliateService.getAllAffiliates(pageNum, limitNum);
  }

  @Get('commissions')
  async getAllCommissions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    return this.affiliateService.getAllCommissions(pageNum, limitNum);
  }
}

