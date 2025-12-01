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

    // Convert prices from provider format (1/10000th units) to dollars
    // Architecture doc: map price / 10000 -> decimal (2500 = $0.25)
    const packageList = (result?.obj?.packageList || []).map((pkg: any) => {
      const priceFromProvider = pkg.price;
      const priceInDollars = priceFromProvider ? priceFromProvider / 10000 : priceFromProvider;
      console.log(`[ESIM] Converting price: ${priceFromProvider} provider units → ${priceInDollars} dollars`);
      return {
        ...pkg,
        price: priceInDollars,
      };
    });

    return {
      packageList,
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

    // Convert prices from provider format (1/10000th units) to dollars
    // Architecture doc: map price / 10000 -> decimal (2500 = $0.25)
    const priceFromProvider = plan.price;
    const priceInDollars = priceFromProvider ? priceFromProvider / 10000 : priceFromProvider;
    console.log(`[ESIM] Single plan conversion: ${priceFromProvider} provider units → ${priceInDollars} dollars`);
    
    return {
      ...plan,
      price: priceInDollars,
    };
  }

  get sdk() {
    return this.esimAccess;
  }
}
