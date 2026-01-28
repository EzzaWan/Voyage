import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(private prisma: PrismaService) {}

  async createPost(data: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: string;
  }) {
    // Generate slug from title if not provided
    let slug = data.slug || this.generateSlug(data.title);
    
    // Ensure slug is unique
    slug = await this.ensureUniqueSlug(slug);

    try {
      const post = await this.prisma.blogPost.create({
        data: {
          id: crypto.randomUUID(),
          title: data.title.trim(),
          slug: slug.trim(),
          excerpt: data.excerpt?.trim() || null,
          content: data.content.trim(),
          featuredImage: data.featuredImage?.trim() || null,
          metaTitle: data.metaTitle?.trim() || null,
          metaDescription: data.metaDescription?.trim() || null,
          status: data.status === 'published' ? 'published' : 'draft',
        },
      });

      this.logger.log(`Blog post created: ${post.id} - ${post.title}`);
      return post;
    } catch (error: any) {
      this.logger.error('Failed to create blog post:', error);
      
      if (error.code === 'P2002') {
        throw new BadRequestException('A blog post with this slug already exists');
      }
      
      throw new BadRequestException(`Failed to create blog post: ${error.message || 'Unknown error'}`);
    }
  }

  async updatePost(id: string, data: {
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: string;
  }) {
    const existingPost = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new NotFoundException('Blog post not found');
    }

    // Handle slug uniqueness if slug is being changed
    let slug = data.slug || existingPost.slug;
    if (data.slug && data.slug !== existingPost.slug) {
      slug = await this.ensureUniqueSlug(data.slug, id);
    }

    try {
      const post = await this.prisma.blogPost.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title.trim() }),
          ...(slug && { slug: slug.trim() }),
          ...(data.excerpt !== undefined && { excerpt: data.excerpt?.trim() || null }),
          ...(data.content && { content: data.content.trim() }),
          ...(data.featuredImage !== undefined && { featuredImage: data.featuredImage?.trim() || null }),
          ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle?.trim() || null }),
          ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription?.trim() || null }),
          ...(data.status && { status: data.status === 'published' ? 'published' : 'draft' }),
        },
      });

      this.logger.log(`Blog post updated: ${post.id} - ${post.title}`);
      return post;
    } catch (error: any) {
      this.logger.error('Failed to update blog post:', error);
      
      if (error.code === 'P2002') {
        throw new BadRequestException('A blog post with this slug already exists');
      }
      
      throw new BadRequestException(`Failed to update blog post: ${error.message || 'Unknown error'}`);
    }
  }

  async getPostBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return post;
  }

  async getPostById(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return post;
  }

  async getPublishedPosts(limit?: number, offset?: number) {
    const posts = await this.prisma.blogPost.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.blogPost.count({
      where: { status: 'published' },
    });

    return {
      posts,
      total,
    };
  }

  async getAllPosts(limit?: number, offset?: number) {
    const posts = await this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.blogPost.count();

    return {
      posts,
      total,
    };
  }

  async deletePost(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    await this.prisma.blogPost.delete({
      where: { id },
    });

    this.logger.log(`Blog post deleted: ${id}`);
    return { success: true };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  private async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.blogPost.findUnique({
        where: { slug: uniqueSlug },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return uniqueSlug;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }
}

