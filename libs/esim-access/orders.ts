import { EsimAccessClient } from './client';
import { OrderRequest, OrderResponse, BaseResponse } from './types';

export class OrdersService {
  constructor(private client: EsimAccessClient) {}

  async orderProfiles(payload: OrderRequest): Promise<BaseResponse<OrderResponse>> {
    return this.client.post('/esim/order', payload);
  }
}
