import { EsimAccessClient } from './client';
import { TopUpRequest, BaseResponse } from './types';
export declare class TopUpService {
    private client;
    constructor(client: EsimAccessClient);
    topupProfile(payload: TopUpRequest): Promise<BaseResponse<any>>;
}
