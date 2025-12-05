import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { ErrorLoggerService } from '../../common/services/error-logger.service';

interface ClientErrorDto {
  message: string;
  stack?: string;
  url: string;
  userAgent?: string;
  componentStack?: string;
}

@Controller('log')
export class LogController {
  private readonly logger = new Logger(LogController.name);

  constructor(private readonly errorLogger: ErrorLoggerService) {}

  @Post('client-error')
  async logClientError(
    @Body() body: ClientErrorDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    try {
      await this.errorLogger.logClientError({
        message: body.message,
        stack: body.stack || body.componentStack,
        url: body.url,
        userAgent: body.userAgent || userAgent,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to log client error:', error);
      return { success: false };
    }
  }
}


