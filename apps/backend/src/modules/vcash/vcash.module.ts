import { Module } from '@nestjs/common';
import { VCashController } from './vcash.controller';
import { VCashService } from './vcash.service';
import { PrismaService } from '../../prisma.service';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../common/modules/common.module';

@Module({
  imports: [ConfigModule, CommonModule],
  controllers: [VCashController],
  providers: [VCashService, PrismaService],
  exports: [VCashService],
})
export class VCashModule {}


