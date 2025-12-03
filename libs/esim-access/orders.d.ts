import { EsimAccessClient } from './client';
import { OrderRequest, OrderResponse, BaseResponse } from './types';
export declare class OrdersService {
    private client;
    constructor(client: EsimAccessClient);
    orderProfiles(payload: OrderRequest): Promise<BaseResponse<OrderResponse>>;
}
