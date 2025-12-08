/**
 * Detect user's currency based on IP geolocation
 * Falls back to localStorage, admin default, or USD
 */
export async function detectCurrency(): Promise<string> {
  // First, check localStorage for saved preference
  if (typeof window !== 'undefined') {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
      return savedCurrency.toUpperCase();
    }
  }

  try {
    // Try to detect currency from IP using ipapi.co
    const response = await fetch('https://ipapi.co/currency/', {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (response.ok) {
      const currency = (await response.text()).trim().toUpperCase();
      
      // Validate that it's one of our supported currencies
      const supportedCurrencies = [
        'USD', 'EUR', 'GBP', 'PLN', 'AED', 'SGD', 'MYR', 'CAD', 'AUD', 'JPY',
        'CHF', 'NZD', 'SEK', 'NOK', 'DKK', 'HKD', 'TWD', 'KRW', 'INR', 'BRL',
        'MXN', 'THB', 'ZAR', 'SAR', 'TRY', 'IDR', 'PHP', 'VND', 'HUF', 'CZK',
        'RON', 'BGN', 'COP', 'CLP', 'PEN', 'NGN', 'KES', 'GHS', 'MAD', 'EGP',
        'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'BDT', 'PKR', 'LKR', 'NPR', 'MMK',
        'KZT', 'UZS', 'AZN', 'GEL', 'CRC', 'UYU'
      ];
      if (supportedCurrencies.includes(currency)) {
        return currency;
      }
    }
  } catch (error) {
    console.warn('[CURRENCY] Failed to detect currency from IP:', error);
  }

  // Fallback: Try to get admin default currency
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${apiUrl}/currency/supported`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.default && typeof data.default === 'string') {
        return data.default.toUpperCase();
      }
    }
  } catch (error) {
    console.warn('[CURRENCY] Failed to get default currency from API:', error);
  }

  // Final fallback: USD
  return 'USD';
}

/**
 * Get saved currency from localStorage or return default
 */
export function getSavedCurrency(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selectedCurrency');
}

/**
 * Save currency preference to localStorage
 */
export function saveCurrency(currency: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('selectedCurrency', currency.toUpperCase());
}
