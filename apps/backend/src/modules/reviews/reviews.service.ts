import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { sanitizeInput } from '../../common/utils/sanitize';
import * as crypto from 'crypto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  async createReview(data: {
    planId?: string;
    userId?: string;
    userName?: string;
    rating: number;
    comment?: string;
    language?: string;
    source?: string;
  }) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Validate comment length only if present
    if (data.comment && data.comment.trim().length > 0) {
      if (data.comment.trim().length < 2) {
        throw new BadRequestException('Comment must be at least 2 characters long');
      }
      if (data.comment.trim().length > 1000) {
        throw new BadRequestException('Comment must be no more than 1000 characters long');
      }
    }

    // Check if user has already reviewed this plan (only if authenticated and plan specific)
    // Skip this check if userId is null/undefined (anonymous reviews)
    if (data.userId && data.planId) {
      const existingReview = await this.prisma.review.findFirst({
        where: {
          planId: data.planId,
          userId: data.userId,
        },
      });

      if (existingReview) {
        throw new BadRequestException('You have already reviewed this plan');
      }
    }

    // All reviews are marked as verified
    const hasPurchased = true;

    // Sanitize inputs - ensure empty strings become null
    const sanitizedComment = data.comment && data.comment.trim().length > 0 
      ? sanitizeInput(data.comment.trim()) 
      : null;
    const sanitizedUserName = data.userName && data.userName.trim().length > 0
      ? sanitizeInput(data.userName.trim())
      : null;

    try {
      const review = await this.prisma.review.create({
        data: {
          id: crypto.randomUUID(),
          planId: (data.planId && typeof data.planId === 'string' && data.planId.trim().length > 0) ? data.planId.trim() : null,
          userId: (data.userId && typeof data.userId === 'string' && data.userId.trim().length > 0) ? data.userId.trim() : null,
          userName: sanitizedUserName,
          rating: data.rating,
          comment: sanitizedComment,
          language: (data.language && typeof data.language === 'string' && data.language.trim().length > 0) ? data.language.trim() : 'en',
          source: (data.source && typeof data.source === 'string' && data.source.trim().length > 0) ? data.source.trim() : 'purchase',
          verified: !!hasPurchased,
        },
      });

      this.logger.log(`Review created: ${review.id} for plan ${data.planId || 'global'} by user ${data.userId || 'anonymous'}, verified=${review.verified}, hasPurchased=${hasPurchased}`);
      return review;
    } catch (error: any) {
      this.logger.error('Failed to create review:', error);
      this.logger.error('Error details:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack,
      });
      this.logger.error('Review data being sent:', {
        planId: data.planId,
        userId: data.userId,
        userName: sanitizedUserName,
        rating: data.rating,
        commentLength: data.comment?.length || 0,
        language: data.language,
        source: data.source,
        hasPurchased,
      });
      
      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        this.logger.error('Foreign key constraint violation - userId or planId does not exist');
        // If userId doesn't exist, set it to null and retry (for anonymous reviews)
        if (error.meta?.field_name?.includes('userId')) {
          this.logger.warn('Retrying with userId set to null');
          try {
            const review = await this.prisma.review.create({
              data: {
                id: crypto.randomUUID(),
                planId: (data.planId && typeof data.planId === 'string' && data.planId.trim().length > 0) ? data.planId.trim() : null,
                userId: null, // Force null if foreign key fails
                userName: sanitizedUserName,
                rating: data.rating,
                comment: sanitizedComment,
                language: (data.language && typeof data.language === 'string' && data.language.trim().length > 0) ? data.language.trim() : 'en',
                source: (data.source && typeof data.source === 'string' && data.source.trim().length > 0) ? data.source.trim() : 'purchase',
                verified: true, // All reviews are verified
              },
            });
            this.logger.log(`Review created (retry): ${review.id}`);
            return review;
          } catch (retryError: any) {
            this.logger.error('Retry also failed:', retryError);
            throw new BadRequestException('Failed to create review: Invalid user or plan reference');
          }
        }
      }
      
      // Re-throw Prisma errors as-is so the exception filter can handle them
      // For other errors, wrap in BadRequestException
      if (error.code && error.code.startsWith('P')) {
        throw error; // Prisma error - let exception filter handle it
      }
      throw new BadRequestException(`Failed to create review: ${error.message || 'Unknown error'}`);
    }
  }

  async getReviewsByPlanId(planId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { planId },
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // All reviews show verified purchase tag
    return reviews.map((review) => ({
      id: review.id,
      planId: review.planId,
      userName: review.userName || 'Anonymous',
      rating: review.rating,
      comment: review.comment,
      language: review.language,
      source: review.source,
      verified: true, // All reviews show verified
      date: review.createdAt.toISOString(),
    }));
  }

  async getAllReviews() {
    const reviews = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // All reviews show verified purchase tag
    return reviews.map((review) => ({
      id: review.id,
      planId: review.planId,
      userName: review.userName || 'Anonymous',
      rating: review.rating,
      comment: review.comment,
      language: review.language,
      source: review.source,
      verified: true, // All reviews show verified
      date: review.createdAt.toISOString(),
    }));
  }

  async getReviews(limit?: number, offset?: number, minRating?: number, hasText?: boolean) {
    const where: any = {};
    if (minRating) {
      where.rating = { gte: minRating };
    }
    if (hasText) {
      where.AND = [
        { comment: { not: null } },
        { comment: { not: "" } }
      ];
    }

    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        User: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const total = await this.prisma.review.count({ where });

    // All reviews show verified purchase tag
    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        planId: review.planId,
        userName: review.userName || 'Anonymous',
        rating: review.rating,
        comment: review.comment,
        language: review.language,
        source: review.source,
        verified: true, // All reviews show verified
        date: review.createdAt.toISOString(),
      })),
      total,
    };
  }

  async getReviewStats() {
    const totalCount = await this.prisma.review.count();
    const aggregations = await this.prisma.review.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // Get count per rating
    const ratingCounts = await this.prisma.review.groupBy({
      by: ['rating'],
      _count: {
        rating: true,
      },
    });

    return {
      totalCount,
      averageRating: aggregations._avg.rating || 0,
      ratingCounts: ratingCounts.reduce((acc, curr) => {
        acc[curr.rating] = curr._count.rating;
        return acc;
      }, {} as Record<number, number>),
    };
  }

  async getTotalReviewCount(): Promise<number> {
    // Return total count of real reviews (mock reviews are generated client-side)
    return this.prisma.review.count();
  }

  async getRealReviewsForAdmin() {
    // Get only real reviews from database (for admin dashboard)
    const reviews = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      planId: review.planId,
      userId: review.userId,
      userName: review.userName || 'Anonymous',
      userEmail: review.User?.email || null,
      rating: review.rating,
      comment: review.comment,
      language: review.language,
      source: review.source,
      verified: review.verified,
      date: review.createdAt.toISOString(),
    }));
  }

  async deleteReview(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    this.logger.log(`Review deleted: ${reviewId}`);
    return { success: true };
  }
}
