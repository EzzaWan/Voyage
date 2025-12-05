import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { json } from 'express';
import { BigIntSerializerInterceptor } from './interceptors/bigint-serializer.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ErrorLoggerService } from './common/services/error-logger.service';
import { SecurityHeadersInterceptor } from './common/interceptors/security-headers.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // THIS exposes req.rawBody
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;

  app.setGlobalPrefix('api');

  // Add global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Add global interceptors
  app.useGlobalInterceptors(
    new BigIntSerializerInterceptor(),
    new SecurityHeadersInterceptor()
  );

  // Add global exception filter for unified error handling
  // Get ErrorLoggerService from app context after module initialization
  const errorLoggerService = app.get(ErrorLoggerService, { strict: false });
  app.useGlobalFilters(new AllExceptionsFilter(errorLoggerService));

  // JSON parser for non-webhook routes only
  const jsonParser = json({ limit: '10mb' });
  app.use((req, res, next) => {
    if (req.path === '/api/webhooks/stripe' || req.path === '/api/webhooks/clerk') {
      // Skip JSON parsing for webhook routes - use rawBody instead
      return next();
    }
    jsonParser(req, res, next);
  });

  // CORS configuration - supports multiple origins for production
  const allowedOrigins = [
    'http://localhost:3000',
    'https://voyage-data.com',
    configService.get('WEB_URL'),
    configService.get('APP_URL'),
    configService.get('CLIENT_URL'),
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  await app.listen(port);
  console.log(`🚀 Backend API is running on port ${port}`);
}

bootstrap();
