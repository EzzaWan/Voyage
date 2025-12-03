"use client";

import { useCurrency } from './providers/CurrencyProvider';
import { useState } from 'react';

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
];

export function CurrencySelector() {
  const { selectedCurrency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const selectedCurrencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--voyage-bg-light)] border border-[var(--voyage-border)] hover:bg-[var(--voyage-card)] transition-colors text-white"
        aria-label="Select currency"
      >
        <span className="text-sm font-medium">{selectedCurrency}</span>
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
