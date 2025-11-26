import { EsimAccessClient } from './client';
import { UsageQueryRequest, BaseResponse, UsageItem } from './types';

export class UsageService {
  constructor(private client: EsimAccessClient) {}

  async getUsage(esimTranNoList: string[]): Promise<BaseResponse<UsageItem[]>> {
    // Doc 4.12 Response Example: "obj": [ { ... } ]
    return this.client.post('/esim/usage/query', { esimTranNoList });
  }
}
