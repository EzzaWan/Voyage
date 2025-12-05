import { Global, Module } from '@nestjs/common';
import { ErrorLoggerService } from '../services/error-logger.service';
import { PrismaService } from '../../prisma.service';

@Global()
@Module({
  providers: [ErrorLoggerService, PrismaService],
  exports: [ErrorLoggerService],
})
export class CommonModule {}

