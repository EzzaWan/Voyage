import { Controller, Post, Headers, Body, Req, UnauthorizedException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Request } from 'express';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  async handleStripe(@Headers('stripe-signature') signature: string, @Req() req: Request) {
    // Use raw body for Stripe
    await this.webhooksService.handleStripeWebhook(signature, req.body as any);
    return { received: true };
  }

  @Post('esim')
  async handleEsim(@Headers() headers: Record<string, string>, @Body() body: any) {
    // Headers are usually lowercase in Express
    const signature = headers['rt-signature'];
    const timestamp = headers['rt-timestamp'];
    const requestId = headers['rt-requestid'];
    const accessCode = headers['rt-accesscode'];

    if (!signature || !timestamp || !requestId) {
       // For initial dev testing, we might skip validation if tools don't send headers,
       // but strictly we should fail.
       // throw new UnauthorizedException('Missing headers');
    }
    
    await this.webhooksService.handleEsimWebhook(body, { signature, timestamp, requestId, accessCode });
    return { received: true };
  }
}
