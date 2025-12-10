import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { sanitizeInput } from '../../common/utils/sanitize';
import * as crypto from 'crypto';

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
    userId?: string;
    orderId?: string;
    device?: string;
    message: string;
  }) {
    // Sanitize all user inputs to prevent XSS
    const sanitizedName = sanitizeInput(data.name);
    const sanitizedMessage = sanitizeInput(data.message);
    const sanitizedDevice = data.device ? sanitizeInput(data.device) : null;

    // Try to find user by email if userId not provided
    let userId = data.userId || null;
    if (!userId) {
      const user = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
        select: { id: true },
      });
      userId = user?.id || null;
    }

    // Save to database with sanitized inputs
    const ticket = await this.prisma.supportTicket.create({
      data: {
        id: crypto.randomUUID(),
        name: sanitizedName,
        email: data.email.toLowerCase().trim(), // Email doesn't need sanitization, just normalize
        userId: userId,
        orderId: data.orderId || null,
        device: sanitizedDevice,
        message: sanitizedMessage,
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
              name: sanitizedName,
              email: data.email,
              orderId: data.orderId || 'N/A',
              device: sanitizedDevice || 'N/A',
              message: sanitizedMessage,
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
      include: {
        SupportTicketReply: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await this.prisma.supportTicket.count();

    return {
      tickets: tickets.map(ticket => ({
        ...ticket,
        replyCount: ticket.SupportTicketReply.length,
      })),
      total,
      limit: options.limit,
      offset: options.offset,
    };
  }

  async getSupportTicketById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        SupportTicketReply: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!ticket) {
      throw new Error('Support ticket not found');
    }

    return ticket;
  }

  /**
   * Add a reply to a support ticket
   */
  async addReply(
    ticketId: string,
    message: string,
    isAdmin: boolean,
    adminEmail?: string,
  ) {
    // Sanitize message
    const sanitizedMessage = sanitizeInput(message);

    // Verify ticket exists
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('Support ticket not found');
    }

    // Create reply
    const reply = await this.prisma.supportTicketReply.create({
      data: {
        id: crypto.randomUUID(),
        ticketId,
        message: sanitizedMessage,
        isAdmin,
        adminEmail: isAdmin ? (adminEmail || null) : null,
      },
    });

    // Send email notification
    try {
      if (isAdmin) {
        // Notify customer of admin reply
        await this.emailService.sendEmail({
          to: ticket.email,
          subject: `Re: Support Ticket - ${ticket.name}`,
          template: 'support-ticket-reply',
          variables: {
            ticketId: ticket.id,
            customerName: ticket.name,
            adminReply: sanitizedMessage,
            ticketMessage: ticket.message,
          },
        });
      } else {
        // Notify admins of customer reply
        const adminEmails = this.config.get<string>('ADMIN_EMAILS', '').split(',').filter(Boolean);
        if (adminEmails.length > 0) {
          for (const adminEmail of adminEmails) {
            await this.emailService.sendEmail({
              to: adminEmail.trim(),
              subject: `Customer Reply: Support Ticket ${ticket.id.substring(0, 8)}... - ${ticket.name}`,
              template: 'support-ticket-reply',
              variables: {
                ticketId: ticket.id,
                customerName: ticket.name,
                customerEmail: ticket.email,
                customerReply: sanitizedMessage,
                ticketMessage: ticket.message,
              },
            });
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to send support ticket reply email:', error);
      // Don't fail the request if email fails
    }

    this.logger.log(`Support ticket reply added: ${reply.id} for ticket ${ticketId}`);

    return reply;
  }

  /**
   * Get support tickets for a specific user
   */
  async getUserSupportTickets(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      include: {
        SupportTicketReply: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tickets;
  }

  /**
   * Get support tickets for a specific email
   */
  async getSupportTicketsByEmail(email: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { email: email.toLowerCase().trim() },
      include: {
        SupportTicketReply: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tickets;
  }
}

