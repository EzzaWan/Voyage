"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const auth_1 = require("./auth");
class WebhooksService {
    constructor(secretKey, accessCode) {
        this.secretKey = secretKey;
        this.accessCode = accessCode;
    }
    verifySignature(signature, body, timestamp, requestId) {
        const headers = (0, auth_1.generateHeaders)(this.accessCode, this.secretKey, body);
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
    parseWebhook(rawBody, headers) {
        const event = rawBody;
        if (!event.notifyType) {
            throw new Error('Invalid webhook payload: missing notifyType');
        }
        return event;
    }
}
exports.WebhooksService = WebhooksService;
//# sourceMappingURL=webhooks.js.map