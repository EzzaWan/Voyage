import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

  async createSupportTicket(data: {
    name: string;
    email: string;
    orderId?: string;
    device?: string;
    message: string;
  }) {
    // Save to database
    const ticket = await this.prisma.supportTicket.create({
      data: {
        name: data.name,
        email: data.email,
        orderId: data.orderId || null,
        device: data.device || null,
        message: data.message,
      },
    });

    // Send email notification to admin
    try {
      const adminEmails = this.config.get<string>('ADMIN_EMAILS', '').split(',').filter(Boolean);
      if (adminEmails.length > 0) {
        for (const adminEmail of adminEmails) {
          await this.emailService.sendEmail({
            to: adminEmail.trim(),
            subject: `New Support Ticket: ${data.name} - ${data.orderId || 'No Order ID'}`,
            template: 'contact-support',
            variables: {
              ticketId: ticket.id,
              name: data.name,
              email: data.email,
              orderId: data.orderId || 'N/A',
              device: data.device || 'N/A',
              message: data.message,
              createdAt: new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to send support ticket email notification:', error);
      // Don't fail the request if email fails
    }

    this.logger.log(`Support ticket created: ${ticket.id} from ${data.email}`);

    return {
      success: true,
      ticketId: ticket.id,
      message: 'Your message has been received. We will get back to you soon.',
    };
  }

  async getSupportTickets(options: { limit: number; offset: number }) {
    const tickets = await this.prisma.supportTicket.findMany({
      take: options.limit,
      skip: options.offset,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await this.prisma.supportTicket.count();

    return {
      tickets,
      total,
      limit: options.limit,
      offset: options.offset,
    };
  }

  async getSupportTicketById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new Error('Support ticket not found');
    }

    return ticket;
  }
}

