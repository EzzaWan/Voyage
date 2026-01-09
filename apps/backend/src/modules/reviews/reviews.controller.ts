import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Headers } from '@nestjs/common';
import { ReviewsService, CreateReviewDto } from './reviews.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { PrismaService } from '../../prisma.service';

@Controller('reviews')
@UseGuards(RateLimitGuard, CsrfGuard)
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RateLimit({ limit: 100, window: 60 })
  async getReviews(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('minRating') minRating?: string,
  ) {
    const result = await this.reviewsService.getReviews(
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
      minRating ? parseInt(minRating, 10) : undefined,
    );
    return result;
  }

  @Post()
  @RateLimit({ limit: 5, window: 3600 }) // 5 reviews per hour
  async createReview(
    @Body() body: CreateReviewDto,
    @Headers('x-user-email') userEmail?: string,
  ) {
    let userId: string | undefined;

    // If user is authenticated, get their userId
    if (userEmail) {
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail.toLowerCase().trim() },
        select: { id: true },
      });
      userId = user?.id;
    }

    return await this.reviewsService.createReview({
      ...body,
      userId,
    });
  }

  @Delete(':id')
  @RateLimit({ limit: 20, window: 60 })
  async deleteReview(@Param('id') id: string) {
    return await this.reviewsService.deleteReview(id);
  }
}

