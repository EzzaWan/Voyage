import { WebhookEvent } from './types';
export declare class WebhooksService {
    private secretKey;
    private accessCode;
    constructor(secretKey: string, accessCode: string);
    verifySignature(signature: string, body: any, timestamp: string, requestId: string): boolean;
    parseWebhook(rawBody: any, headers: any): WebhookEvent;
}
