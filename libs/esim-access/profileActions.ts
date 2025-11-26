import { EsimAccessClient } from './client';
import { ProfileActionRequest, BaseResponse } from './types';

export class ProfileActionsService {
  constructor(private client: EsimAccessClient) {}

  async cancel(data: ProfileActionRequest): Promise<BaseResponse<any>> {
    return this.client.post('/esim/cancel', data);
  }

  async suspend(data: ProfileActionRequest): Promise<BaseResponse<any>> {
    return this.client.post('/esim/suspend', data);
  }

  async unsuspend(data: ProfileActionRequest): Promise<BaseResponse<any>> {
    return this.client.post('/esim/unsuspend', data);
  }

  async revoke(data: ProfileActionRequest): Promise<BaseResponse<any>> {
    return this.client.post('/esim/revoke', data);
  }
}

