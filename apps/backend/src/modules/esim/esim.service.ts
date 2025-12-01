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

  // Helper to generate flag URL from country code
  private getFlagUrl(code: string, type: number): string | undefined {
    // Only generate flags for countries (type 1), not continents (type 2)
    if (type !== 1) return undefined;
    
    // Handle special codes (e.g., "NA-3" should use "NA" or skip)
    const countryCode = code.split('-')[0].toLowerCase();
    
    // Use flagcdn.com for reliable flag images
    // Format: https://flagcdn.com/w320/{code}.png or .svg
    // Using w320 for HD quality on retina displays
    return `https://flagcdn.com/w320/${countryCode}.png`;
  }

  // ---- 1. GET SUPPORTED REGIONS ----
  async getLocations() {
    // SDK uses client.post for raw endpoints
    const result = await this.esimAccess.client.post<any>('/location/list', {});
    const rawLocationList = result?.obj?.locationList || [];
    
    // Normalize and add flag URLs
    const normalizedList: any[] = [];
    const seenCodes = new Set<string>(); // Track codes to avoid duplicates
    
    for (const location of rawLocationList) {
      // Add country/continent directly (if not already seen)
      if (!seenCodes.has(location.code)) {
        normalizedList.push({
          code: location.code,
          name: location.name,
          locationLogo: this.getFlagUrl(location.code, location.type),
        });
        seenCodes.add(location.code);
      }
      
      // If it's a continent (type 2), also add sub-locations
      if (location.type === 2 && location.subLocation && Array.isArray(location.subLocation)) {
        for (const subLoc of location.subLocation) {
          if (!seenCodes.has(subLoc.code)) {
            normalizedList.push({
              code: subLoc.code,
              name: subLoc.name,
              locationLogo: this.getFlagUrl(subLoc.code, 1), // Sub-locations are countries (type 1)
            });
            seenCodes.add(subLoc.code);
          }
        }
      }
    }
    
    return {
      locationList: normalizedList,
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
