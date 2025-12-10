import { Controller, Post, Body, BadRequestException, UseGuards, Get, Query, Param, NotFoundException, Req, Headers, Logger } from '@nestjs/common';
import { SupportService } from './support.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { SkipCsrf } from '../../common/decorators/skip-csrf.decorator';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CreateSupportTicketDto } from '../../common/dto/support-ticket.dto';

@Controller('support')
@UseGuards(RateLimitGuard, CsrfGuard)
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  @SkipCsrf() // Skip CSRF for public contact form
  @RateLimit({ limit: 10, window: 3600 }) // 10 requests per hour (spam protection)
  async submitContact(@Body() body: CreateSupportTicketDto) {
    try {
      // Validate required fields manually if needed
      if (!body.name || !body.name.trim()) {
        throw new BadRequestException('Name is required');
      }
      if (!body.email || !body.email.trim()) {
        throw new BadRequestException('Email is required');
      }
      if (!body.message || !body.message.trim()) {
        throw new BadRequestException('Message is required');
      }
      if (body.message.trim().length < 10) {
        throw new BadRequestException('Message must be at least 10 characters long');
      }
      if (body.message.trim().length > 1000) {
        throw new BadRequestException('Message must be no more than 1000 characters long');
      }

      return this.supportService.createSupportTicket({
        name: body.name.trim(),
        email: body.email.trim(),
        orderId: body.orderId?.trim() || undefined,
        device: body.device?.trim() || undefined,
        message: body.message.trim(),
      });
    } catch (error) {
      this.logger.error('Error creating support ticket:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to create support ticket');
    }
  }

  @Get('tickets')
  async getUserTickets(@Headers('x-user-email') userEmail?: string) {
    if (!userEmail) {
      throw new BadRequestException('User email is required');
    }

    // Try to find user by email to get userId
    const prisma = (this.supportService as any).prisma;
    const user = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase().trim() },
    });

    if (user) {
      // If user exists, get tickets by userId
      return this.supportService.getUserSupportTickets(user.id);
    } else {
      // Fallback to email-based lookup
      return this.supportService.getSupportTicketsByEmail(userEmail);
    }
  }

  @Get('tickets/:id')
  async getTicket(@Param('id') id: string, @Headers('x-user-email') userEmail?: string) {
    if (!userEmail) {
      throw new BadRequestException('User email is required');
    }

    const ticket = await this.supportService.getSupportTicketById(id);

    // Verify ownership - check if email matches or if userId matches
    const prisma = (this.supportService as any).prisma;
    const user = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase().trim() },
    });

    if (ticket.email.toLowerCase() !== userEmail.toLowerCase().trim() && 
        (ticket.userId !== user?.id || !user)) {
      throw new NotFoundException('Support ticket not found');
    }

    return ticket;
  }

  @Post('tickets/:id/reply')
  @RateLimit({ limit: 20, window: 3600 }) // 20 replies per hour
  async addReply(
    @Param('id') ticketId: string,
    @Body() body: { message: string },
    @Headers('x-user-email') userEmail?: string,
  ) {
    if (!userEmail) {
      throw new BadRequestException('User email is required');
    }

    if (!body.message || !body.message.trim()) {
      throw new BadRequestException('Message is required');
    }

    if (body.message.trim().length < 10) {
      throw new BadRequestException('Message must be at least 10 characters long');
    }

    if (body.message.trim().length > 1000) {
      throw new BadRequestException('Message must be no more than 1000 characters long');
    }

    try {
      // Verify ticket ownership before allowing reply
      const ticket = await this.supportService.getSupportTicketById(ticketId);
      const prisma = (this.supportService as any).prisma;
      const user = await prisma.user.findUnique({
        where: { email: userEmail.toLowerCase().trim() },
      });

      // Verify ownership
      if (ticket.email.toLowerCase() !== userEmail.toLowerCase().trim() && 
          (ticket.userId !== user?.id || !user)) {
        throw new NotFoundException('Support ticket not found');
      }

      // Add customer reply (isAdmin = false)
      return await this.supportService.addReply(ticketId, body.message.trim(), false);
    } catch (error) {
      this.logger.error('Error adding customer reply:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to add reply');
    }
  }
}

@Controller('admin/support')
@UseGuards(AdminGuard)
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  async getSupportTickets(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const result = await this.supportService.getSupportTickets({
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    
    // Result already includes replyCount from service
    return result;
  }

  @Get('tickets/:id')
  async getSupportTicket(@Param('id') id: string) {
    try {
      return await this.supportService.getSupportTicketById(id);
    } catch (error) {
      throw new NotFoundException('Support ticket not found');
    }
  }

  @Post('tickets/:id/reply')
  async addReply(
    @Param('id') ticketId: string,
    @Body() body: { message: string },
    @Req() req: any,
  ) {
    if (!body.message || !body.message.trim()) {
      throw new BadRequestException('Message is required');
    }

    try {
      const adminEmail = req.adminEmail; // Set by AdminGuard
      return await this.supportService.addReply(ticketId, body.message, true, adminEmail);
    } catch (error) {
      if (error.message === 'Support ticket not found') {
        throw new NotFoundException('Support ticket not found');
      }
      throw new BadRequestException(error.message || 'Failed to add reply');
    }
  }
}
