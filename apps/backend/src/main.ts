import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { json } from 'express';
import { BigIntSerializerInterceptor } from './interceptors/bigint-serializer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // THIS exposes req.rawBody
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3001;

  app.setGlobalPrefix('api');

  // Add global interceptor to serialize BigInt values
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());

  // JSON parser for non-webhook routes only
  const jsonParser = json({ limit: '10mb' });
  app.use((req, res, next) => {
    if (req.path === '/api/webhooks/stripe') {
      // Skip JSON parsing for Stripe webhook - use rawBody instead
      return next();
    }
    jsonParser(req, res, next);
  });

  // CORS configuration - supports multiple origins for production
  const allowedOrigins = [
    'http://localhost:3000',
    configService.get('WEB_URL'),
    configService.get('APP_URL'),
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
