import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EsimAccess } from '../../../../../libs/esim-access';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { CurrencyConverterService } from '../admin/currency-converter.service';
import { QueryProfilesResponse, BaseResponse, LocationListResponse } from '../../../../../libs/esim-access/types';

@Injectable()
export class EsimService {
  private esimAccess: EsimAccess;
  private readonly logger = new Logger(EsimService.name);

  constructor(
    private config: ConfigService,
    @Inject(forwardRef(() => AdminSettingsService))
    private adminSettingsService: AdminSettingsService,
    @Inject(forwardRef(() => CurrencyConverterService))
    private currencyConverter: CurrencyConverterService,
  ) {
    this.esimAccess = new EsimAccess({
      accessCode: this.config.get<string>('ESIM_ACCESS_CODE')!,
      secretKey: this.config.get<string>('ESIM_SECRET_KEY')!,
      baseUrl: this.config.get<string>('ESIM_API_BASE')!,
    });
  }

  // Expose esimAccess for controller use
  getEsimAccess(): EsimAccess {
    return this.esimAccess;
  }

  // Check if mock mode is enabled
  async mockEnabled(): Promise<boolean> {
    return await this.adminSettingsService.getMockMode();
  }

  // Apply markup to price
  async applyMarkup(providerPriceCents: number): Promise<number> {
    const markupPercent = await this.adminSettingsService.getDefaultMarkupPercent();
    if (markupPercent === 0) {
      return providerPriceCents;
    }
    const finalPriceCents = Math.round(providerPriceCents * (1 + markupPercent / 100));
    this.logger.log(`[MARKUP] Applied ${markupPercent}% markup: ${providerPriceCents} → ${finalPriceCents} cents`);
    return finalPriceCents;
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

  // ---- MOCK HANDLERS ----
  private async mockRequest(endpoint: string, data?: any): Promise<any> {
    this.logger.log(`[MOCK] Handling mock request: ${endpoint}`);
    
    if (endpoint === '/esim/order') {
      return {
        success: true,
        obj: {
          orderNo: `MOCK-${Date.now()}`,
        },
      };
    }

    if (endpoint === '/esim/query') {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      return {
        success: true,
        obj: {
          esimList: [
            {
              esimTranNo: `MOCK-${Date.now()}`,
              iccid: `MOCK-ICCID-${Date.now()}`,
              qrCodeUrl: 'https://mock.qr',
              ac: 'MOCK-AC',
              smdpStatus: 'RELEASED',
              esimStatus: 'GOT_RESOURCE',
              totalVolume: 1073741824, // 1GB
              expiredTime: futureDate.toISOString(),
              orderNo: data?.orderNo || `MOCK-ORDER-${Date.now()}`,
            },
          ],
        },
      };
    }

    if (endpoint === '/esim/topup') {
      return {
        success: true,
        obj: {
          orderNo: `MOCK-TOPUP-${Date.now()}`,
        },
      };
    }

    // Default mock response
    return {
      success: true,
      obj: {},
    };
  }

  // Wrapper for client requests that checks mock mode
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const isMock = await this.mockEnabled();
    
    if (isMock) {
      return this.mockRequest(endpoint, data);
    }

    // Real provider request
    return this.esimAccess.client.request(method, endpoint, data);
  }

  // ---- 1. GET SUPPORTED REGIONS ----
  async getLocations() {
    // Always fetch real locations (not mocked) - locations are read-only data
    // Mock mode only affects order/query/topup operations, not data fetching
    const result = await this.esimAccess.client.request('POST', '/location/list', {}) as any;
    const locationData = result?.obj as LocationListResponse | undefined;
    const rawLocationList: any[] = locationData?.locationList || [];
    
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
    const result = await this.esimAccess.packages.getPackagesByLocation(locationCode);
    const isMock = await this.mockEnabled();

    // Convert prices from provider format (1/10000th units) to dollars
    // Architecture doc: map price / 10000 -> decimal (2500 = $0.25)
    const packageList = await Promise.all((result?.obj?.packageList || []).map(async (pkg: any) => {
      const priceFromProvider = pkg.price; // Provider price in 1/10000th units
      
      // Convert to cents: provider units / 10000 * 100 = cents
      // Example: 2500 units / 10000 * 100 = 25 cents
      const providerPriceCents = priceFromProvider ? Math.round((priceFromProvider / 10000) * 100) : 0;
      
      // Apply markup
      const finalPriceCents = await this.applyMarkup(providerPriceCents);
      
      // Convert to dollars for frontend
      const priceInDollars = finalPriceCents / 100;
      
      // Handle currency - always use defaultCurrency setting (overrides provider currencyCode)
      // Provider prices are always in USD, but we display in defaultCurrency
      const defaultCurrency = await this.adminSettingsService.getDefaultCurrency();
      // Use defaultCurrency setting (which defaults to 'USD' if not configured)
      const currency = defaultCurrency || 'USD';
      
      // Convert currency if target is not USD (provider prices are always in USD)
      let finalPrice = priceInDollars;
      if (currency && currency.toUpperCase() !== 'USD') {
        this.logger.log(`[CURRENCY] Converting ${pkg.packageCode} from USD to ${currency}: ${priceInDollars} USD`);
        const convertedCents = await this.currencyConverter.convertCurrency(finalPriceCents, 'USD', currency.toUpperCase());
        finalPrice = convertedCents / 100;
        this.logger.log(`[CURRENCY] Converted to ${finalPrice} ${currency}`);
      } else {
        this.logger.log(`[CURRENCY] Using USD for ${pkg.packageCode}: ${priceInDollars} USD`);
      }
      
      if (!isMock) {
        this.logger.log(`[ESIM] Package ${pkg.packageCode}: ${priceFromProvider} provider units → ${priceInDollars} dollars (with markup)`);
      }
      
      return {
        ...pkg,
        price: finalPrice,
        currencyCode: currency,
      };
    }));

    return {
      packageList,
    };
  }

  // ---- 3. GET SINGLE PLAN ----
  async getPlan(packageCode: string) {
    const result = await this.esimAccess.packages.getPackageDetails(packageCode);
    const isMock = await this.mockEnabled();

    const plan = result?.obj?.packageList?.[0];

    if (!plan) {
      throw new NotFoundException(`Package ${packageCode} not found`);
    }

    // Convert prices from provider format (1/10000th units) to dollars
    const priceFromProvider = plan.price; // Provider price in 1/10000th units
    
    // Convert to cents: provider units / 10000 * 100 = cents
    // Example: 2500 units / 10000 * 100 = 25 cents
    const providerPriceCents = priceFromProvider ? Math.round((priceFromProvider / 10000) * 100) : 0;
    
    // Apply markup
    const finalPriceCents = await this.applyMarkup(providerPriceCents);
    
    // Convert to dollars for frontend
    const priceInDollars = finalPriceCents / 100;
    
    // Handle currency - always use defaultCurrency setting (overrides provider currencyCode)
    // Provider prices are always in USD, but we display in defaultCurrency
    const defaultCurrency = await this.adminSettingsService.getDefaultCurrency();
    // Use defaultCurrency setting (which defaults to 'USD' if not configured)
    const currency = defaultCurrency || 'USD';
    
    // Convert currency if target is not USD (provider prices are always in USD)
    let finalPrice = priceInDollars;
    if (currency && currency.toUpperCase() !== 'USD') {
      this.logger.log(`[CURRENCY] Converting plan ${packageCode} from USD to ${currency}: ${priceInDollars} USD`);
      const convertedCents = await this.currencyConverter.convertCurrency(finalPriceCents, 'USD', currency.toUpperCase());
      finalPrice = convertedCents / 100;
      this.logger.log(`[CURRENCY] Converted to ${finalPrice} ${currency}`);
    } else {
      this.logger.log(`[CURRENCY] Using USD for plan ${packageCode}: ${priceInDollars} USD`);
    }
    
    if (!isMock) {
      this.logger.log(`[ESIM] Single plan conversion: ${priceFromProvider} provider units → ${priceInDollars} dollars (with markup)`);
    }
    
    return {
      ...plan,
      price: finalPrice,
      currencyCode: currency,
    };
  }

  // Get SDK with mock-aware client and services
  get sdk() {
    const service = this;
    
    // Create proxied client
    const proxiedClient = new Proxy(this.esimAccess.client, {
      get(clientTarget, clientProp) {
        if (clientProp === 'request' || clientProp === 'post' || clientProp === 'get') {
          return async function(methodOrUrl: string, urlOrData?: any, data?: any) {
            let method = 'POST';
            let endpoint = '';
            let requestData: any = undefined;

            if (clientProp === 'request') {
              method = methodOrUrl;
              endpoint = urlOrData;
              requestData = data;
            } else if (clientProp === 'post') {
              method = 'POST';
              endpoint = methodOrUrl;
              requestData = urlOrData;
            } else if (clientProp === 'get') {
              method = 'GET';
              endpoint = methodOrUrl;
              requestData = urlOrData;
            }

            // Check mock mode and intercept if needed
            const isMock = await service.mockEnabled();
            if (isMock && (endpoint === '/esim/order' || endpoint === '/esim/query' || endpoint === '/esim/topup')) {
              return service.mockRequest(endpoint, requestData);
            }

            // Real request
            if (clientProp === 'request') {
              return clientTarget.request(method, endpoint, requestData);
            } else if (clientProp === 'post') {
              return clientTarget.post(endpoint, requestData);
            } else {
              return clientTarget.get(endpoint, requestData);
            }
          };
        }
        return clientTarget[clientProp as keyof typeof clientTarget];
      },
    });

    // Return proxy that intercepts both client and service access
    return new Proxy(this.esimAccess, {
      get(target, prop) {
        if (prop === 'client') {
          return proxiedClient;
        }
        // Proxy services that use the client
        if (prop === 'topup' || prop === 'orders' || prop === 'query') {
          const originalService = target[prop as keyof typeof target];
          return new Proxy(originalService, {
            get(serviceTarget, serviceProp) {
              const originalMethod = serviceTarget[serviceProp as keyof typeof serviceTarget];
              if (typeof originalMethod === 'function') {
                const methodFunc = originalMethod as (...args: any[]) => Promise<any>;
                return async function(...args: any[]) {
                  const isMock = await service.mockEnabled();
                  
                  // Intercept service methods when mock mode is enabled
                  if (isMock) {
                    if (prop === 'topup' && serviceProp === 'topupProfile') {
                      return service.mockRequest('/esim/topup', args[0]);
                    }
                    if (prop === 'orders' && serviceProp === 'orderProfiles') {
                      return service.mockRequest('/esim/order', args[0]);
                    }
                    if (prop === 'query' && serviceProp === 'queryProfiles') {
                      return service.mockRequest('/esim/query', args[0]);
                    }
                  }
                  
                  // For non-mocked or other methods, call original
                  return methodFunc.apply(serviceTarget, args);
                };
              }
              return originalMethod;
            },
          });
        }
        return target[prop as keyof typeof target];
      },
    });
  }
}
