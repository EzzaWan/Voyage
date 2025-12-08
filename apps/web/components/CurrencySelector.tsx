"use client";

import { useCurrency } from './providers/CurrencyProvider';
import { useState, useEffect } from 'react';

const SUPPORTED_CURRENCIES = [
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

export function CurrencySelector() {
  const { selectedCurrency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only showing currency after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedCurrencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] hover:bg-[var(--voyage-card)] transition-colors text-white"
        aria-label="Select currency"
      >
        <span className="text-sm font-medium">{mounted ? selectedCurrency : 'USD'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--voyage-card)] border border-[var(--voyage-border)] rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => {
                  setCurrency(currency.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-[var(--voyage-bg-light)] transition-colors flex items-center justify-between ${
                  selectedCurrency === currency.code
                    ? 'bg-[var(--voyage-bg-light)] text-[var(--voyage-accent)]'
                    : 'text-white'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{currency.code}</span>
                  <span className="text-xs text-[var(--voyage-muted)]">{currency.name}</span>
                </div>
                {selectedCurrency === currency.code && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
