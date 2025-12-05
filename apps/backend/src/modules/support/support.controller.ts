import { Controller, Post, Body, BadRequestException, UseGuards, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { SupportService } from './support.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('support')
@UseGuards(RateLimitGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  @RateLimit({ limit: 5, window: 300 }) // 5 requests per 5 minutes
  async submitContact(@Body() body: {
    name: string;
    email: string;
    orderId?: string;
    device?: string;
    message: string;
  }) {
    if (!body.name || !body.email || !body.message) {
      throw new BadRequestException('Name, email, and message are required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw new BadRequestException('Invalid email address');
    }

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
