import { Module, forwardRef } from '@nestjs/common';
import { SupportController, AdminSupportController } from './support.controller';
import { SupportService } from './support.service';
import { PrismaService } from '../../prisma.service';
import { EmailModule } from '../email/email.module';
import { AdminModule } from '../admin/admin.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [EmailModule, ConfigModule, forwardRef(() => AdminModule)],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, PrismaService],
})
export class SupportModule {}

