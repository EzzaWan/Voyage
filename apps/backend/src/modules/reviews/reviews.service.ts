import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface CreateReviewDto {
  userName: string;
  rating: number;
  comment: string;
  userId?: string;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReviews(limit?: number, offset?: number) {
    const reviews = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.review.count();

    return {
      reviews,
      total,
    };
  }

  async getReviewById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async createReview(dto: CreateReviewDto) {
    // Validate rating
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Validate comment length
    if (!dto.comment || dto.comment.trim().length < 3) {
      throw new BadRequestException('Comment must be at least 3 characters long');
    }

    if (dto.comment.trim().length > 1000) {
      throw new BadRequestException('Comment must be no more than 1000 characters long');
    }

    // Validate username
    if (!dto.userName || dto.userName.trim().length < 1) {
      throw new BadRequestException('User name is required');
    }

    return await this.prisma.review.create({
      data: {
        userName: dto.userName.trim(),
        rating: dto.rating,
        comment: dto.comment.trim(),
        verified: dto.userId ? true : false, // Auto-verify if user is authenticated
        userId: dto.userId,
      },
    });
  }

  async deleteReview(id: string) {
    const review = await this.getReviewById(id);
    
    await this.prisma.review.delete({
      where: { id },
    });

    return { success: true };
  }
}


