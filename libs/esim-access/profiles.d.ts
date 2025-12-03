import { EsimAccessClient } from './client';
import { ProfileActionRequest, BaseResponse } from './types';
export declare class ProfilesService {
    private client;
    constructor(client: EsimAccessClient);
    cancel(payload: ProfileActionRequest): Promise<BaseResponse<any>>;
    suspend(payload: ProfileActionRequest): Promise<BaseResponse<any>>;
    unsuspend(payload: ProfileActionRequest): Promise<BaseResponse<any>>;
    revoke(payload: ProfileActionRequest): Promise<BaseResponse<any>>;
}
