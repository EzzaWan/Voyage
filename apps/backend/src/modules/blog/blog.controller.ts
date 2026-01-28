import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @RateLimit({ limit: 100, window: 60 })
  async getPublishedPosts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;
    
    return this.blogService.getPublishedPosts(limitNum, offsetNum);
  }

  @Get(':slug')
  @RateLimit({ limit: 100, window: 60 })
  async getPostBySlug(@Param('slug') slug: string) {
    try {
      const post = await this.blogService.getPostBySlug(slug);
      
      // Only return published posts to public
      if (post.status !== 'published') {
        throw new NotFoundException('Blog post not found');
      }
      
      return post;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Blog post not found');
    }
  }
}

@Controller('admin/blog')
@UseGuards(RateLimitGuard, CsrfGuard, AdminGuard)
export class AdminBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async getAllPosts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;
    
    return this.blogService.getAllPosts(limitNum, offsetNum);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    // For admin, try to get by slug first, then by ID
    try {
      return await this.blogService.getPostBySlug(id);
    } catch {
      // If not found by slug, try by ID
      return await this.blogService.getPostById(id);
    }
  }

  @Post()
  @RateLimit({ limit: 20, window: 60 })
  async createPost(@Body() body: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: string;
  }) {
    return this.blogService.createPost(body);
  }

  @Put(':id')
  @RateLimit({ limit: 20, window: 60 })
  async updatePost(
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      slug?: string;
      excerpt?: string;
      content?: string;
      featuredImage?: string;
      metaTitle?: string;
      metaDescription?: string;
      status?: string;
    },
  ) {
    return this.blogService.updatePost(id, body);
  }

  @Delete(':id')
  @RateLimit({ limit: 20, window: 60 })
  async deletePost(@Param('id') id: string) {
    return this.blogService.deletePost(id);
  }
}

