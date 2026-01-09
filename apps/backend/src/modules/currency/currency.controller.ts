import { Controller, Get, Query, Param } from '@nestjs/common';
import { CurrencyService } from './currency.service';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('rates')
  async getRates() {
    const currencies = this.currencyService.getAvailableCurrencies();
    const rates: Record<string, number> = {};

    for (const currency of currencies) {
      rates[currency] = await this.currencyService.getRate(currency);
    }

    return {
      success: true,
      base: 'USD',
      rates,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('from') from: string = 'USD',
    @Query('to') to: string,
  ) {
    if (!amount || !to) {
      return {
        success: false,
        error: 'Missing required parameters: amount and to',
      };
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return {
        success: false,
        error: 'Invalid amount parameter',
      };
    }

    // For now, we only support USD as base currency
    if (from.toUpperCase() !== 'USD') {
      return {
        success: false,
        error: 'Currently only USD as source currency is supported',
      };
    }

    try {
      const convertedAmount = await this.currencyService.convert(amountNum, to);
      
      return {
        success: true,
        from: {
          currency: 'USD',
          amount: amountNum,
        },
        to: {
          currency: to.toUpperCase(),
          amount: convertedAmount,
        },
        rate: await this.currencyService.getRate(to),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Conversion failed',
      };
    }
  }

  @Get('supported')
  async getSupported() {
    return {
      success: true,
      currencies: this.currencyService.getAvailableCurrencies(),
      default: await this.currencyService.getDefaultCurrency(),
    };
  }

  @Get('detect')
  async detectCurrency() {
    try {
      // Proxy ipapi.co currency detection to avoid CORS issues
      const response = await fetch('https://ipapi.co/currency/', {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
      });

      if (response.ok) {
        const currency = (await response.text()).trim().toUpperCase();
        
        // Validate that it's one of our supported currencies
        const supportedCurrencies = this.currencyService.getAvailableCurrencies();
        if (supportedCurrencies.includes(currency)) {
          return {
            success: true,
            currency,
          };
        }
      }
      
      // Fallback to default currency
      const defaultCurrency = await this.currencyService.getDefaultCurrency();
      return {
        success: true,
        currency: defaultCurrency || 'USD',
      };
    } catch (error) {
      // Fallback to default currency on error
      const defaultCurrency = await this.currencyService.getDefaultCurrency();
      return {
        success: true,
        currency: defaultCurrency || 'USD',
      };
    }
  }
}
