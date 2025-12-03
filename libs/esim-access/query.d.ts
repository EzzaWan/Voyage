import { EsimAccessClient } from './client';
import { QueryProfilesRequest, QueryProfilesResponse, BaseResponse } from './types';
export declare class QueryService {
    private client;
    constructor(client: EsimAccessClient);
    queryProfiles(params: QueryProfilesRequest): Promise<BaseResponse<QueryProfilesResponse>>;
}
