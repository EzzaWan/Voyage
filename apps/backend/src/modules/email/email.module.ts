import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { AdminEmailController } from './email.controller';
import { PrismaService } from '../../prisma.service';
import { AdminModule } from '../admin/admin.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [AdminEmailController],
  providers: [EmailService, PrismaService],
  exports: [EmailService],
})
export class EmailModule {}

