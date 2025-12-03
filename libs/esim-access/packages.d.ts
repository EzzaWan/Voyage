import { EsimAccessClient } from './client';
import { PackageListRequest, PackageListResponse, LocationListResponse, BaseResponse } from './types';
export declare class PackagesService {
    private client;
    constructor(client: EsimAccessClient);
    getAllPackages(params: PackageListRequest): Promise<BaseResponse<PackageListResponse>>;
    getPackagesByLocation(locationCode: string): Promise<BaseResponse<PackageListResponse>>;
    getTopupPlans(input: {
        locationCode?: string;
        iccid?: string;
    }): Promise<BaseResponse<PackageListResponse>>;
    getPackageDetails(packageCodeOrSlug: string): Promise<BaseResponse<PackageListResponse>>;
    getSupportedRegions(): Promise<BaseResponse<LocationListResponse>>;
}
