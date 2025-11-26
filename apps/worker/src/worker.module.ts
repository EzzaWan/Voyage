import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ProvisionProcessor } from './processors/provision.processor';
import { WebhookProcessor } from './processors/webhook.processor';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      { name: 'provisionQueue' },
      { name: 'webhookQueue' }
    ),
  ],
  providers: [ProvisionProcessor, WebhookProcessor, PrismaService],
})
export class WorkerModule {}

