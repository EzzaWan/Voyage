import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CurrencyConverterService {
  private readonly logger = new Logger(CurrencyConverterService.name);

  async convertCurrency(amountCents: number, fromCurrency: string, toCurrency: string): Promise<number> {
    // If currencies are the same, no conversion needed
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return amountCents;
    }

    // If from currency is USD, we can use the free API
    if (fromCurrency.toUpperCase() === 'USD') {
      try {
        // Convert cents to dollars for API call
        const amountDollars = amountCents / 100;
        
        // Use exchangerate-api.com (free, no API key needed)
        const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
        this.logger.log(`[CURRENCY] Fetching exchange rate from ${fromCurrency} to ${toCurrency}`);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Exchange rate API returned ${response.status}`);
        }
        
        const data = await response.json();
        const rate = data.rates?.[toCurrency.toUpperCase()];
        
        if (rate && typeof rate === 'number') {
          // Convert using the rate
          const convertedAmount = amountDollars * rate;
          const resultCents = Math.round(convertedAmount * 100);
          this.logger.log(`[CURRENCY] Converted ${amountCents} cents (${amountDollars} ${fromCurrency}) → ${resultCents} cents (${convertedAmount.toFixed(2)} ${toCurrency}) at rate ${rate}`);
          return resultCents;
        } else {
          this.logger.warn(`[CURRENCY] Rate not found for ${toCurrency}, falling back to original`);
          return amountCents;
        }
      } catch (error) {
        this.logger.error(`[CURRENCY] Conversion error, falling back to original:`, error);
        return amountCents;
      }
    }

    // For non-USD conversions, fall back to original (or implement full conversion later)
    this.logger.warn(`[CURRENCY] Non-USD conversion not supported yet: ${fromCurrency} → ${toCurrency}`);
    return amountCents;
  }
}

