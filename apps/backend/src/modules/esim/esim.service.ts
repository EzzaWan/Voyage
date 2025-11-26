import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EsimAccess } from '../../../../../libs/esim-access';

@Injectable()
export class EsimService {
  private esimAccess: EsimAccess;

  constructor(private config: ConfigService) {
    this.esimAccess = new EsimAccess({
      accessCode: this.config.get<string>('ESIM_ACCESS_CODE')!,
      secretKey: this.config.get<string>('ESIM_SECRET_KEY')!,
      baseUrl: this.config.get<string>('ESIM_API_BASE')!,
    });
  }

  // ---- 1. GET SUPPORTED REGIONS ----
  async getLocations() {
    // SDK uses client.post for raw endpoints
    const result = await this.esimAccess.client.post<any>('/location/list', {});
    return {
      locationList: result?.obj?.locationList || [],
    };
  }

  // ---- 2. GET PACKAGES FOR A COUNTRY ----
  async getPackages(locationCode: string) {
    const result = await this.esimAccess.packages.getPackagesByLocation(
      locationCode
    );

    return {
      packageList: result?.obj?.packageList || [],
    };
  }

  // ---- 3. GET SINGLE PLAN ----
  async getPlan(packageCode: string) {
    const result = await this.esimAccess.packages.getPackageDetails(
      packageCode
    );

    const plan = result?.obj?.packageList?.[0];

    if (!plan) {
      throw new NotFoundException(`Package ${packageCode} not found`);
    }

    return plan;
  }

  get sdk() {
    return this.esimAccess;
  }
}
