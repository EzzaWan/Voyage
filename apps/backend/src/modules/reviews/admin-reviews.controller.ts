import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('admin/reviews')
@UseGuards(AdminGuard)
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getReviews() {
    const result = await this.reviewsService.getReviews();
    return result;
  }

  @Delete(':id')
  async deleteReview(@Param('id') id: string) {
    return await this.reviewsService.deleteReview(id);
  }
}


