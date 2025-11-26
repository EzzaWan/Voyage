import { EsimAccessClient } from './client';
import { ProfileActionRequest, BaseResponse } from './types';

export class ProfilesService {
  constructor(private client: EsimAccessClient) {}

  async cancel(payload: ProfileActionRequest): Promise<BaseResponse<any>> {
    return this.client.post('/esim/cancel', payload);
  }

  async suspend(payload: ProfileActionRequest): Promise<BaseResponse<any>> {
    return this.client.post('/esim/suspend', payload);
  }

  async unsuspend(payload: ProfileActionRequest): Promise<BaseResponse<any>> {
    return this.client.post('/esim/unsuspend', payload);
  }

  async revoke(payload: ProfileActionRequest): Promise<BaseResponse<any>> {
    return this.client.post('/esim/revoke', payload);
  }
}

