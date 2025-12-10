import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SecurityLoggerService } from '../../common/services/security-logger.service';
import { getClientIp } from '../../common/utils/webhook-ip-whitelist';
import * as crypto from 'crypto';

@Injectable()
export class VCashService {
  private readonly logger = new Logger(VCashService.name);

  constructor(
    private prisma: PrismaService,
    private securityLogger: SecurityLoggerService,
  ) {}

  /**
   * Get V-Cash balance for a user (in cents)
   */
  async getBalance(userId: string): Promise<number> {
    const balance = await this.prisma.vCashBalance.findUnique({
      where: { userId },
    });

    return balance?.balanceCents || 0;
  }

  /**
   * Get V-Cash transactions for a user with pagination
   */
  async getTransactions(
    userId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{ transactions: any[]; total: number; totalPages: number }> {
    const skip = (page - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      this.prisma.vCashTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.vCashTransaction.count({
        where: { userId },
      }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amountCents: t.amountCents,
        reason: t.reason,
        metadata: t.metadata,
        createdAt: t.createdAt,
      })),
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Credit V-Cash to user account
   */
  async credit(
    userId: string,
    amountCents: number,
    reason: string,
    metadata?: any,
    ip?: string,
  ): Promise<void> {
    if (amountCents <= 0) {
      throw new BadRequestException('Credit amount must be greater than 0');
    }

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Upsert balance (create if doesn't exist)
      const balance = await tx.vCashBalance.upsert({
        where: { userId },
        update: {
          balanceCents: {
            increment: amountCents,
          },
        },
        create: {
          userId,
          balanceCents: amountCents,
          updatedAt: new Date(),
        },
      });

      // Create transaction record
      await tx.vCashTransaction.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type: 'credit',
          amountCents,
          reason,
          metadata: metadata || {},
        },
      });

      this.logger.log(
        `[VCASH] Credited ${amountCents} cents to user ${userId} (reason: ${reason}). New balance: ${balance.balanceCents + amountCents}`,
      );
    });

    // Log security event
    try {
      await this.securityLogger.logSecurityEvent({
        type: 'VCASH_CREDIT' as any,
        userId,
        ip,
        details: {
          amountCents,
          reason,
          metadata,
        },
      });
    } catch (error) {
      this.logger.warn('Failed to log VCASH_CREDIT security event:', error);
    }
  }

  /**
   * Debit V-Cash from user account
   */
  async debit(
    userId: string,
    amountCents: number,
    reason: string,
    metadata?: any,
    ip?: string,
  ): Promise<void> {
    if (amountCents <= 0) {
      throw new BadRequestException('Debit amount must be greater than 0');
    }

    // Use transaction to ensure atomicity and prevent negative balance
    await this.prisma.$transaction(async (tx) => {
      // Get current balance
      const balance = await tx.vCashBalance.findUnique({
        where: { userId },
      });

      const currentBalance = balance?.balanceCents || 0;

      if (currentBalance < amountCents) {
        throw new BadRequestException(
          `Insufficient V-Cash balance. Available: ${currentBalance} cents, requested: ${amountCents} cents`,
        );
      }

      // Update or create balance
      await tx.vCashBalance.upsert({
        where: { userId },
        update: {
          balanceCents: {
            decrement: amountCents,
          },
        },
        create: {
          userId,
          balanceCents: 0 - amountCents, // Should never happen, but for safety
          updatedAt: new Date(),
        },
      });

      // Create transaction record
      await tx.vCashTransaction.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type: 'debit',
          amountCents,
          reason,
          metadata: metadata || {},
        },
      });

      this.logger.log(
        `[VCASH] Debited ${amountCents} cents from user ${userId} (reason: ${reason}). New balance: ${currentBalance - amountCents}`,
      );
    });

    // Log security event
    try {
      await this.securityLogger.logSecurityEvent({
        type: 'VCASH_DEBIT' as any,
        userId,
        ip,
        details: {
          amountCents,
          reason,
          metadata,
        },
      });
    } catch (error) {
      this.logger.warn('Failed to log VCASH_DEBIT security event:', error);
    }
  }
}

