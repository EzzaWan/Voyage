import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminSettingsService } from '../admin/admin-settings.service';

@Injectable()
export class CurrencyService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyService.name);
  private ratesCache: Map<string, number> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly SUPPORTED_CURRENCIES = [
    'USD', 'EUR', 'GBP', 'PLN', 'AED', 'SGD', 'MYR', 'CAD', 'AUD', 'JPY',
    'CHF', 'NZD', 'SEK', 'NOK', 'DKK', 'HKD', 'TWD', 'KRW', 'INR', 'BRL',
    'MXN', 'THB', 'ZAR', 'SAR', 'TRY', 'IDR', 'PHP', 'VND', 'HUF', 'CZK',
    'RON', 'BGN', 'COP', 'CLP', 'PEN', 'NGN', 'KES', 'GHS', 'MAD', 'EGP',
    'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'BDT', 'PKR', 'LKR', 'NPR', 'MMK',
    'KZT', 'UZS', 'AZN', 'GEL', 'CRC', 'UYU'
  ];

  constructor(
    private config: ConfigService,
    private adminSettingsService: AdminSettingsService,
  ) {}

  async onModuleInit() {
    // Pre-load rates on module initialization
    await this.refreshRates();
  }

  /**
   * Fetch exchange rates from ExchangeRate-API and cache them
   */
  async refreshRates(): Promise<void> {
    const apiKey = this.config.get<string>('EXCHANGE_RATE_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('[CURRENCY] EXCHANGE_RATE_API_KEY not configured, using fallback rates');
      // Set all rates to 1 as fallback
      this.SUPPORTED_CURRENCIES.forEach(currency => {
        this.ratesCache.set(currency, currency === 'USD' ? 1 : 1);
      });
      this.cacheTimestamp = Date.now();
      return;
    }

    try {
      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
      this.logger.log('[CURRENCY] Fetching exchange rates from ExchangeRate-API...');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`ExchangeRate-API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result !== 'success' || !data.conversion_rates) {
        throw new Error('Invalid response format from ExchangeRate-API');
      }

      // Cache all supported currencies
      this.SUPPORTED_CURRENCIES.forEach(currency => {
        const rate = data.conversion_rates[currency];
        if (rate && typeof rate === 'number') {
          this.ratesCache.set(currency, rate);
          this.logger.log(`[CURRENCY] Cached rate: USD → ${currency} = ${rate}`);
        } else {
          // Fallback to 1 if rate not available
          this.ratesCache.set(currency, currency === 'USD' ? 1 : 1);
          this.logger.warn(`[CURRENCY] Rate not found for ${currency}, using fallback rate of 1`);
        }
      });

      this.cacheTimestamp = Date.now();
      this.logger.log('[CURRENCY] Exchange rates refreshed and cached');
    } catch (error) {
      this.logger.error('[CURRENCY] Failed to fetch exchange rates, using fallback:', error);
      // Fallback: set all rates to 1
      this.SUPPORTED_CURRENCIES.forEach(currency => {
        this.ratesCache.set(currency, currency === 'USD' ? 1 : 1);
      });
      this.cacheTimestamp = Date.now();
    }
  }

  /**
   * Get exchange rate for a currency (with cache check)
   */
  async getRate(currency: string): Promise<number> {
    const upperCurrency = currency.toUpperCase();
    
    // Check if cache is expired
    if (Date.now() - this.cacheTimestamp > this.CACHE_DURATION) {
      this.logger.log('[CURRENCY] Cache expired, refreshing rates...');
      await this.refreshRates();
    }

    // Check if currency is supported
    if (!this.SUPPORTED_CURRENCIES.includes(upperCurrency)) {
      this.logger.warn(`[CURRENCY] Currency ${upperCurrency} not supported, returning rate of 1`);
      return 1;
    }

    const rate = this.ratesCache.get(upperCurrency);
    if (rate === undefined) {
      // If not cached, try to refresh
      await this.refreshRates();
      const refreshedRate = this.ratesCache.get(upperCurrency);
      return refreshedRate ?? 1;
    }

    return rate;
  }

  /**
   * Convert amount from USD to target currency
   */
  async convert(amountUSD: number, targetCurrency: string): Promise<number> {
    const upperCurrency = targetCurrency.toUpperCase();
    
    if (upperCurrency === 'USD') {
      return amountUSD;
    }

    const rate = await this.getRate(upperCurrency);
    const converted = amountUSD * rate;
    
    this.logger.log(`[CURRENCY] Converted ${amountUSD} USD → ${converted.toFixed(2)} ${upperCurrency} at rate ${rate}`);
    
    return converted;
  }

  /**
   * Get list of supported currencies
   */
  getAvailableCurrencies(): string[] {
    return [...this.SUPPORTED_CURRENCIES];
  }

  /**
   * Get default currency from admin settings
   */
  async getDefaultCurrency(): Promise<string> {
    try {
      const defaultCurrency = await this.adminSettingsService.getDefaultCurrency();
      if (defaultCurrency && this.SUPPORTED_CURRENCIES.includes(defaultCurrency.toUpperCase())) {
        return defaultCurrency.toUpperCase();
      }
    } catch (error) {
      this.logger.warn('[CURRENCY] Failed to get default currency from admin settings, using USD');
    }
    return 'USD';
  }
}
