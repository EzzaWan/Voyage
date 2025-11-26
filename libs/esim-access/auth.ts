import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface AuthHeaders {
  'RT-AccessCode': string;
  'RT-Timestamp': string;
  'RT-RequestID': string;
  'RT-Signature': string;
}

export function generateHeaders(
  accessCode: string,
  secretKey: string,
  body: any
): AuthHeaders {
  const timestamp = Date.now().toString();
  const requestId = uuidv4().replace(/-/g, ''); // Remove dashes to match example if needed, though doc says UUID v4. Example shows no dashes? 
  // Doc example: RequestID = 4ce9d9cdac9e4e17b3a2c66c358c1ce2 (no dashes, length 32)
  // UUID v4 standard has dashes. Let's remove them to be safe and match the "hex" look of the example.
  
  const requestBodyStr = body ? JSON.stringify(body) : '';
  
  // signData = Timestamp + RequestID + AccessCode + RequestBody
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
