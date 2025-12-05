import { Controller, Post, Body, BadRequestException, UseGuards, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { SupportService } from './support.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CreateSupportTicketDto } from '../../common/dto/support-ticket.dto';

@Controller('support')
@UseGuards(RateLimitGuard, CsrfGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  @RateLimit({ limit: 3, window: 3600 }) // 3 requests per hour (spam protection)
  async submitContact(@Body() body: CreateSupportTicketDto) {
    return this.supportService.createSupportTicket(body);
  }
}

@Controller('admin/support')
@UseGuards(AdminGuard)
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  async getSupportTickets(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.supportService.getSupportTickets({
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('tickets/:id')
  async getSupportTicket(@Param('id') id: string) {
    try {
      return await this.supportService.getSupportTicketById(id);
    } catch (error) {
      throw new NotFoundException('Support ticket not found');
    }
  }
}
