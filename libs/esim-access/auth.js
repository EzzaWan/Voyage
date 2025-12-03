"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHeaders = generateHeaders;
const crypto = require("crypto");
const uuid_1 = require("uuid");
function generateHeaders(accessCode, secretKey, body) {
    const timestamp = Date.now().toString();
    const requestId = (0, uuid_1.v4)().replace(/-/g, '');
    const requestBodyStr = body ? JSON.stringify(body) : '';
    const signData = timestamp + requestId + accessCode + requestBodyStr;
    const signature = crypto
        .createHmac('sha256', secretKey)
        .update(signData)
        .digest('hex')
        .toLowerCase();
    return {
        'RT-AccessCode': accessCode,
        'RT-Timestamp': timestamp,
        'RT-RequestID': requestId,
        'RT-Signature': signature,
    };
}
//# sourceMappingURL=auth.js.map