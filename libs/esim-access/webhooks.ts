import { generateHeaders } from './auth';
import { WebhookEvent, WebhookBase } from './types';

export class WebhooksService {
  constructor(private secretKey: string, private accessCode: string) {}

  verifySignature(signature: string, body: any, timestamp: string, requestId: string): boolean {
    // Reconstruct signature
    // signData = Timestamp + RequestID + AccessCode + RequestBody
    // Note: Incoming webhook might have different headers or order.
    // The doc says "Signature Calculation" generally.
    // Assuming the webhook sends the SAME headers: RT-AccessCode, RT-Timestamp, RT-RequestID, RT-Signature.
    // And we must verify using our SecretKey.
    
    const headers = generateHeaders(this.accessCode, this.secretKey, body);
    // We can't reuse generateHeaders exactly because it generates NEW timestamp/requestId.
    // We need to verify the INCOMING ones.
    
    // Implementation of verify logic:
    const requestBodyStr = body ? JSON.stringify(body) : '';
    const signData = timestamp + requestId + this.accessCode + requestBodyStr;
    const crypto = require('crypto');
    const calculated = crypto
      .createHmac('sha256', this.secretKey)
      .update(signData)
      .digest('hex')
      .toLowerCase();
      
    return calculated === signature;
  }

  parseWebhook(rawBody: any, headers: any): WebhookEvent {
    // In a real scenario, we'd validate signature here if headers are provided
    // Cast rawBody to WebhookEvent
    // Basic validation of notifyType
    const event = rawBody as WebhookEvent;
    if (!event.notifyType) {
        throw new Error('Invalid webhook payload: missing notifyType');
    }
    return event;
  }
}
