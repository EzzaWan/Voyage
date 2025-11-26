import { EsimAccessClient } from './client';
import { QueryProfilesRequest, QueryProfilesResponse, BaseResponse } from './types';

export class QueryService {
  constructor(private client: EsimAccessClient) {}

  async queryProfiles(params: QueryProfilesRequest): Promise<BaseResponse<QueryProfilesResponse>> {
    return this.client.post('/esim/query', params);
  }
}
