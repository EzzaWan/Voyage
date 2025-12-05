import { Module } from '@nestjs/common';
import { SupportController, AdminSupportController } from './support.controller';
import { SupportService } from './support.service';
import { PrismaService } from '../../prisma.service';
import { EmailModule } from '../email/email.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [EmailModule, ConfigModule],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, PrismaService],
})
export class SupportModule {}

