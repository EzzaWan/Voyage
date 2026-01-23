import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../api/client';

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  rates: Record<string, number>;
  convert: (amountUSD: number) => number;
  convertFromCurrency: (amount: number, fromCurrency: string) => number;
  formatPrice: (amount: number) => string;
  loading: boolean;
}

const defaultContext: CurrencyContextType = {
  selectedCurrency: 'USD',
  setCurrency: () => {},
  rates: { USD: 1 },
  convert: (amount: number) => amount,
  convertFromCurrency: (amount: number, _: string) => amount,
  formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  loading: true,
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

const CURRENCY_STORAGE_KEY = 'voyo_currency';

// Supported currencies with symbols
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee' },
  { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee' },
  { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
  { code: 'UZS', symbol: 'лв', name: 'Uzbekistani Som' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
  { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
  { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón' },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
];

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [loading, setLoading] = useState(true);

  // Initialize currency and fetch rates
  useEffect(() => {
    async function initialize() {
      try {
        // Load saved currency preference
        const savedCurrency = await SecureStore.getItemAsync(CURRENCY_STORAGE_KEY);
        if (savedCurrency) {
          setSelectedCurrency(savedCurrency.toUpperCase());
        } else {
          // Try to detect from IP
          try {
            const detectResult = await apiFetch<{ success: boolean; currency?: string }>('/currency/detect');
            if (detectResult.success && detectResult.currency) {
              const detected = detectResult.currency.toUpperCase();
              // Only use if it's in our supported list
              if (SUPPORTED_CURRENCIES.some(c => c.code === detected)) {
                setSelectedCurrency(detected);
                await SecureStore.setItemAsync(CURRENCY_STORAGE_KEY, detected);
              }
            }
          } catch (detectErr) {
            console.warn('[CURRENCY] Failed to detect currency:', detectErr);
          }
        }

        // Fetch exchange rates
        const ratesData = await apiFetch<{ rates: Record<string, number> }>('/currency/rates');
        if (ratesData.rates) {
          setRates(ratesData.rates);
        }
      } catch (error) {
        console.error('[CURRENCY] Failed to initialize:', error);
        setRates({ USD: 1 });
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // Refresh rates periodically (every hour)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const ratesData = await apiFetch<{ rates: Record<string, number> }>('/currency/rates');
        if (ratesData.rates) {
          setRates(ratesData.rates);
        }
      } catch (error) {
        console.warn('[CURRENCY] Failed to refresh rates:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const setCurrency = async (currency: string) => {
    const upperCurrency = currency.toUpperCase();
    setSelectedCurrency(upperCurrency);
    try {
      await SecureStore.setItemAsync(CURRENCY_STORAGE_KEY, upperCurrency);
    } catch (error) {
      console.warn('[CURRENCY] Failed to save currency:', error);
    }
  };

  const convert = (amountUSD: number): number => {
    if (selectedCurrency === 'USD') {
      return amountUSD;
    }

    const rate = rates[selectedCurrency];
    if (!rate || rate === 0) {
      return amountUSD;
    }

    return amountUSD * rate;
  };

  const convertFromCurrency = (amount: number, fromCurrency: string): number => {
    const from = fromCurrency.toUpperCase();
    const to = selectedCurrency.toUpperCase();

    // No conversion needed if currencies match
    if (from === to) {
      return amount;
    }

    // If source is USD, use the regular convert function
    if (from === 'USD') {
      return convert(amount);
    }

    // Convert from source currency to USD first, then to target currency
    const fromRate = rates[from];
    if (!fromRate || fromRate === 0) {
      // If we don't have the rate, return as-is
      return amount;
    }

    // Convert to USD first
    const amountInUSD = amount / fromRate;

    // Then convert to target currency
    return convert(amountInUSD);
  };

  const formatPrice = (amount: number): string => {
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);
    
    try {
      // For some currencies with large values (JPY, KRW, IDR, VND), don't show decimals
      const noDecimalCurrencies = ['JPY', 'KRW', 'IDR', 'VND', 'HUF', 'CLP', 'COP'];
      const decimals = noDecimalCurrencies.includes(selectedCurrency) ? 0 : 2;
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      const symbol = currencyInfo?.symbol || selectedCurrency;
      return `${symbol}${amount.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setCurrency,
        rates,
        convert,
        convertFromCurrency,
        formatPrice,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

