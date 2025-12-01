import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

import { json } from 'express';
import { BigIntSerializerInterceptor } from './interceptors/bigint-serializer.interceptor';

async function bootstrap() {

  const app = await NestFactory.create(AppModule, {

    rawBody: true,     // THIS exposes req.rawBody

  });



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

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  await app.listen(3001);

}

bootstrap();
