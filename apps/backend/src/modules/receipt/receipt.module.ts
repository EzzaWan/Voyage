import { Module, forwardRef } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { PrismaService } from '../../prisma.service';
import { EsimModule } from '../esim/esim.module';

@Module({
  imports: [forwardRef(() => EsimModule)],
  providers: [ReceiptService, PrismaService],
  exports: [ReceiptService],
})
export class ReceiptModule {}

