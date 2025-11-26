import { EsimAccessClient } from './client';
import { PackageListRequest, PackageListResponse, LocationListResponse, BaseResponse } from './types';

export class PackagesService {
  constructor(private client: EsimAccessClient) {}

  async getAllPackages(params: PackageListRequest): Promise<BaseResponse<PackageListResponse>> {
    return this.client.post('/package/list', params);
  }

  async getPackagesByLocation(locationCode: string): Promise<BaseResponse<PackageListResponse>> {
    return this.getAllPackages({ locationCode, type: 'BASE' });
  }

  async getTopupPlans(input: { locationCode?: string; iccid?: string }): Promise<BaseResponse<PackageListResponse>> {
    return this.getAllPackages({ ...input, type: 'TOPUP' });
  }

  async getPackageDetails(packageCodeOrSlug: string): Promise<BaseResponse<PackageListResponse>> {
     // Search by code first, if empty try slug? API doc has both fields.
     // We'll just pass one.
     return this.getAllPackages({ packageCode: packageCodeOrSlug });
  }
  
  async getSupportedRegions(): Promise<BaseResponse<LocationListResponse>> {
      return this.client.post('/location/list');
  }
}
