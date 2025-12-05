import { Module } from '@nestjs/common';
import { LogController } from './log.controller';
import { ErrorLoggerService } from '../../common/services/error-logger.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [LogController],
  providers: [ErrorLoggerService, PrismaService],
})
export class LogModule {}


