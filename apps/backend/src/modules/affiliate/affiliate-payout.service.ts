import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { AffiliateCommissionService } from './affiliate-commission.service';
import { EmailService } from '../email/email.service';
import { sanitizeInput, sanitizeEmail } from '../../common/utils/sanitize';
import { SecurityLoggerService } from '../../common/services/security-logger.service';
import * as crypto from 'crypto';

@Injectable()
export class AffiliatePayoutService {
  private readonly logger = new Logger(AffiliatePayoutService.name);
  private readonly MIN_PAYOUT_CENTS: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private commissionService: AffiliateCommissionService,
    private securityLogger: SecurityLoggerService,
    @Inject(forwardRef(() => EmailService))
    private emailService?: EmailService,
  ) {
    // Minimum payout threshold (default $0 = 0 cents - no minimum)
    const envMinPayout = this.config.get<number>('AFFILIATE_MIN_PAYOUT_CENTS');
    this.MIN_PAYOUT_CENTS = envMinPayout !== undefined ? envMinPayout : 0;
  }

  /**
   * Save payout method (PayPal or Bank)
   */
  async savePayoutMethod(
    affiliateId: string,
    type: 'paypal' | 'bank',
    paypalEmail?: string,
    bankHolderName?: string,
    bankIban?: string,
    bankSwift?: string,
  ): Promise<any> {
    if (type === 'paypal') {
      if (!paypalEmail || typeof paypalEmail !== 'string') {
        throw new BadRequestException('Valid PayPal email is required');
      }
      const trimmedEmail = paypalEmail.trim().toLowerCase();
      if (!trimmedEmail || !trimmedEmail.includes('@') || trimmedEmail.length < 3) {
        throw new BadRequestException('Valid PayPal email is required (must contain @ symbol)');
      }
      paypalEmail = sanitizeEmail(trimmedEmail);
      if (!paypalEmail.includes('@')) {
        throw new BadRequestException('Email validation failed after sanitization');
      }
    } else if (type === 'bank') {
      if (!bankHolderName || !bankIban) {
        throw new BadRequestException('Bank holder name and IBAN are required');
      }
      bankHolderName = sanitizeInput(bankHolderName.trim());
      bankIban = sanitizeInput(bankIban.trim().toUpperCase());
      bankSwift = bankSwift ? sanitizeInput(bankSwift.trim().toUpperCase()) : null;
    } else {
      throw new BadRequestException('Invalid payout method type. Must be "paypal" or "bank"');
    }

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    if (affiliate.isFrozen) {
      throw new ForbiddenException('Affiliate account is frozen. Cannot update payout method.');
    }

    const payoutMethod = await this.prisma.affiliatePayoutMethod.upsert({
      where: { affiliateId: affiliate.userId },
      update: {
        type,
        paypalEmail: type === 'paypal' ? paypalEmail : null,
        bankHolderName: type === 'bank' ? bankHolderName : null,
        bankIban: type === 'bank' ? bankIban : null,
        bankSwift: type === 'bank' ? bankSwift : null,
      },
      create: {
        id: crypto.randomUUID(),
        affiliateId: affiliate.userId,
        type,
        paypalEmail: type === 'paypal' ? paypalEmail : null,
        bankHolderName: type === 'bank' ? bankHolderName : null,
        bankIban: type === 'bank' ? bankIban : null,
        bankSwift: type === 'bank' ? bankSwift : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(`[PAYOUT] Saved payout method for affiliate ${affiliateId}: ${type}`);
    return payoutMethod;
  }

  /**
   * Get payout method for affiliate
   */
  async getPayoutMethod(affiliateId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      return null;
    }

    return this.prisma.affiliatePayoutMethod.findUnique({
      where: { affiliateId: affiliate.userId },
    });
  }

  /**
   * Delete payout method
   */
  async deletePayoutMethod(affiliateId: string, methodId: string): Promise<void> {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    const method = await this.prisma.affiliatePayoutMethod.findFirst({
      where: {
        id: methodId,
        affiliateId: affiliate.userId,
      },
    });

    if (!method) {
      throw new NotFoundException('Payout method not found or does not belong to this affiliate');
    }

    await this.prisma.affiliatePayoutMethod.delete({
      where: { id: methodId },
    });

    this.logger.log(`[PAYOUT] Deleted payout method ${methodId} for affiliate ${affiliateId}`);
  }

  /**
   * Create payout request
   */
  async createPayoutRequest(affiliateId: string, amountCents: number): Promise<any> {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found');
    }

    if (affiliate.isFrozen) {
      throw new ForbiddenException('Affiliate account is frozen. Cannot request payout.');
    }

    const payoutMethod = await this.getPayoutMethod(affiliateId);
    if (!payoutMethod) {
      throw new BadRequestException('Payout method must be configured before requesting payout');
    }

    const balances = await this.commissionService.getCommissionBalances(affiliateId);

    // Validate amount (minimum is 0, but must be positive)
    if (amountCents <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Only check minimum if it's set above 0
    if (this.MIN_PAYOUT_CENTS > 0 && amountCents < this.MIN_PAYOUT_CENTS) {
      throw new BadRequestException(
        `Minimum payout is ${this.MIN_PAYOUT_CENTS / 100} (${this.MIN_PAYOUT_CENTS} cents)`,
      );
    }

    if (amountCents > balances.availableBalance) {
      throw new BadRequestException(
        `Requested amount (${amountCents} cents) exceeds available balance (${balances.availableBalance} cents)`,
      );
    }

    const pendingRequests = await this.prisma.affiliatePayoutRequest.count({
      where: {
        affiliateId,
        status: 'pending',
      },
    });

    if (pendingRequests > 0) {
      throw new BadRequestException('You already have a pending payout request');
    }

    const payoutRequest = await this.prisma.affiliatePayoutRequest.create({
      data: {
        id: crypto.randomUUID(),
        affiliateId,
        amountCents,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `[PAYOUT] Created payout request ${payoutRequest.id} for affiliate ${affiliateId}: ${amountCents} cents`,
    );

    // Send email to affiliate (fire and forget)
    if (this.emailService) {
      try {
        const affiliate = await this.prisma.affiliate.findUnique({
          where: { id: affiliateId },
          include: { User: true },
        });

        if (affiliate?.User?.email) {
          const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
          await this.emailService.sendAffiliatePayoutRequested(
            affiliate.User.email,
            {
              payoutRequest: {
                id: payoutRequest.id,
                amountCents: payoutRequest.amountCents,
              },
              dashboardUrl: `${webUrl}/account/affiliate/payout`,
            },
          );
        }
      } catch (err) {
        this.logger.error(`[PAYOUT] Failed to send payout requested email:`, err);
      }
    }

    return payoutRequest;
  }

  /**
   * Get payout history for an affiliate
   */
  async getPayoutHistory(affiliateId: string, limit: number = 50) {
    return this.prisma.affiliatePayoutRequest.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get payout requests for admin panel (with filtering)
   */
  async getAllPayoutRequests(
    page: number = 1,
    limit: number = 50,
    status?: string,
    affiliateId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (affiliateId) {
      where.affiliateId = affiliateId;
    }

    const [requests, total] = await Promise.all([
      this.prisma.affiliatePayoutRequest.findMany({
        where,
        include: {
          Affiliate: {
            include: {
              User: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
              AffiliatePayoutMethod: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.affiliatePayoutRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve payout request
   */
  async approvePayoutRequest(requestId: string, adminEmail: string): Promise<any> {
    const request = await this.prisma.affiliatePayoutRequest.findUnique({
      where: { id: requestId },
      include: { Affiliate: { include: { User: true } } },
    });

    if (!request) {
      throw new NotFoundException('Payout request not found');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException(`Payout request is already ${request.status}`);
    }

    const updatedRequest = await this.prisma.affiliatePayoutRequest.update({
      where: { id: requestId },
      data: { status: 'approved', adminNote: `Approved by ${adminEmail}` },
    });

    this.logger.log(
      `[PAYOUT] Admin ${adminEmail} approved payout request ${requestId} for affiliate ${request.affiliateId}`,
    );
    await this.securityLogger.logSecurityEvent({
      type: 'AFFILIATE_PAYOUT_CHANGE',
      userId: request.Affiliate.userId,
      details: {
        requestId,
        oldStatus: request.status,
        newStatus: updatedRequest.status,
        adminEmail,
      },
    });

    if (this.emailService && request.Affiliate.User?.email) {
      try {
        const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
        await this.emailService.sendAffiliatePayoutApproved(
          request.Affiliate.User.email,
          {
            payoutRequest: {
              id: updatedRequest.id,
              amountCents: updatedRequest.amountCents,
            },
            dashboardUrl: `${webUrl}/account/affiliate/payout/history`,
          },
        );
      } catch (err) {
        this.logger.error(`[PAYOUT] Failed to send payout approved email:`, err);
      }
    }

    return updatedRequest;
  }

  /**
   * Decline payout request
   */
  async declinePayoutRequest(requestId: string, adminEmail: string, adminNote?: string): Promise<any> {
    const request = await this.prisma.affiliatePayoutRequest.findUnique({
      where: { id: requestId },
      include: { Affiliate: { include: { User: true } } },
    });

    if (!request) {
      throw new NotFoundException('Payout request not found');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException(`Payout request is already ${request.status}`);
    }

    const updatedRequest = await this.prisma.affiliatePayoutRequest.update({
      where: { id: requestId },
      data: { status: 'declined', adminNote: adminNote || `Declined by ${adminEmail}` },
    });

    this.logger.log(
      `[PAYOUT] Admin ${adminEmail} declined payout request ${requestId}${adminNote ? ` with note: ${adminNote}` : ''}`,
    );
    await this.securityLogger.logSecurityEvent({
      type: 'AFFILIATE_PAYOUT_CHANGE',
      userId: request.Affiliate.userId,
      details: {
        requestId,
        oldStatus: request.status,
        newStatus: updatedRequest.status,
        adminEmail,
        adminNote,
      },
    });

    if (this.emailService && request.Affiliate.User?.email) {
      try {
        const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
        await this.emailService.sendAffiliatePayoutDeclined(
          request.Affiliate.User.email,
          {
            payoutRequest: {
              id: updatedRequest.id,
              amountCents: updatedRequest.amountCents,
              adminNote: updatedRequest.adminNote,
            },
            dashboardUrl: `${webUrl}/account/affiliate/payout/history`,
          },
        );
      } catch (err) {
        this.logger.error(`[PAYOUT] Failed to send payout declined email:`, err);
      }
    }

    return updatedRequest;
  }

  /**
   * Mark payout as paid
   */
  async markPayoutAsPaid(requestId: string, adminEmail: string): Promise<any> {
    const request = await this.prisma.affiliatePayoutRequest.findUnique({
      where: { id: requestId },
      include: { Affiliate: { include: { User: true } } },
    });

    if (!request) {
      throw new NotFoundException('Payout request not found');
    }
    if (request.status !== 'approved') {
      throw new BadRequestException(
        `Payout request must be 'approved' to be marked as paid. Current status: ${request.status}`,
      );
    }

    const updatedRequest = await this.prisma.affiliatePayoutRequest.update({
      where: { id: requestId },
      data: { status: 'paid', processedAt: new Date(), adminNote: `Marked paid by ${adminEmail}` },
    });

    this.logger.log(
      `[PAYOUT] Admin ${adminEmail} marked payout request ${requestId} as paid for affiliate ${request.affiliateId}`,
    );
    await this.securityLogger.logSecurityEvent({
      type: 'AFFILIATE_PAYOUT_CHANGE',
      userId: request.Affiliate.userId,
      details: {
        requestId,
        oldStatus: request.status,
        newStatus: updatedRequest.status,
        adminEmail,
      },
    });

    if (this.emailService && request.Affiliate.User?.email) {
      try {
        const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
        await this.emailService.sendAffiliatePayoutPaid(
          request.Affiliate.User.email,
          {
            payoutRequest: {
              id: updatedRequest.id,
              amountCents: updatedRequest.amountCents,
              processedAt: updatedRequest.processedAt,
            },
            dashboardUrl: `${webUrl}/account/affiliate/payout/history`,
          },
        );
      } catch (err) {
        this.logger.error(`[PAYOUT] Failed to send payout paid email:`, err);
      }
    }

    return updatedRequest;
  }
}
