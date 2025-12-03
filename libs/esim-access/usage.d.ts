import { EsimAccessClient } from './client';
import { BaseResponse, UsageItem } from './types';
export declare class UsageService {
    private client;
    constructor(client: EsimAccessClient);
    getUsage(esimTranNoList: string[]): Promise<BaseResponse<UsageItem[]>>;
}
