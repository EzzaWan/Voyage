import { Module } from '@nestjs/common';
import { BlogController, AdminBlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { PrismaService } from '../../prisma.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [BlogController, AdminBlogController],
  providers: [BlogService, PrismaService],
  exports: [BlogService],
})
export class BlogModule {}










