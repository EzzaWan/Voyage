export interface AuthHeaders {
    'RT-AccessCode': string;
    'RT-Timestamp': string;
    'RT-RequestID': string;
    'RT-Signature': string;
}
export declare function generateHeaders(accessCode: string, secretKey: string, body: any): AuthHeaders;
