import { EsimAccessClient } from './client';
import { TopUpRequest, BaseResponse } from './types';

export class TopUpService {
  constructor(private client: EsimAccessClient) {}

  async topupProfile(payload: TopUpRequest): Promise<BaseResponse<any>> {
    return this.client.post('/esim/topup', payload);
  }
}
