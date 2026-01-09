import { Controller, Post, Body, Get, Param, Delete, UseGuards, Headers, BadRequestException, Logger } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { AdminGuard } from '../admin/guards/admin.guard';
import { getUserIdFromEmail } from '../../common/utils/get-user-id';
import { PrismaService } from '../../prisma.service';

@Controller('reviews')
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name);

  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(RateLimitGuard, CsrfGuard)
  @RateLimit({ limit: 20, window: 3600 }) // 20 reviews per hour
  async createReview(
    @Body() body: { planId?: string; userName?: string; rating: number; comment?: string; language?: string; source?: string },
    @Headers('x-user-email') userEmail: string | undefined,
  ) {
    // Allow anonymous reviews - userEmail is optional
    let userId: string | null = null;
    if (userEmail) {
      // Try to get userId from email, but allow reviews even if user doesn't exist in DB yet
      userId = await getUserIdFromEmail(this.prisma, userEmail);
      // userId will be null if user doesn't exist, which is fine - review will be anonymous
    }

    return this.reviewsService.createReview({
      planId: body.planId || undefined,
      userId: userId || undefined, // null from getUserIdFromEmail becomes undefined
      userName: body.userName,
      rating: body.rating,
      comment: body.comment,
      language: body.language,
      source: body.source,
    });
  }

  @Get('stats')
  @RateLimit({ limit: 100, window: 60 })
  async getReviewStats() {
    return this.reviewsService.getReviewStats();
  }

  @Get('plan/:planId')
  @RateLimit({ limit: 100, window: 60 })
  async getReviewsByPlan(@Param('planId') planId: string) {
    return this.reviewsService.getReviewsByPlanId(planId);
  }

  @Get('all')
  @RateLimit({ limit: 100, window: 60 })
  async getAllReviews() {
    return this.reviewsService.getAllReviews();
  }

  @Get('count')
  @RateLimit({ limit: 100, window: 60 })
  async getTotalCount() {
    return { count: await this.reviewsService.getTotalReviewCount() };
  }
}

@Controller('admin/reviews')
@UseGuards(RateLimitGuard, CsrfGuard, AdminGuard)
export class AdminReviewsController {
  private readonly logger = new Logger(AdminReviewsController.name);

  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getRealReviews() {
    return this.reviewsService.getRealReviewsForAdmin();
  }

  @Delete(':id')
  @RateLimit({ limit: 20, window: 60 })
  async deleteReview(@Param('id') id: string) {
    return this.reviewsService.deleteReview(id);
  }
}
