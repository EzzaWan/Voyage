"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectCurrency, saveCurrency as saveCurrencyLocal } from '@/lib/detectCurrency';

interface CurrencyContextType {
  selectedCurrency: string;
  setCurrency: (currency: string) => void;
  rates: Record<string, number>;
  convert: (amountUSD: number) => number;
  formatCurrency: (amount: number) => string;
  loading: boolean;
}

const defaultContext: CurrencyContextType = {
  selectedCurrency: 'USD',
  setCurrency: () => {},
  rates: { USD: 1 },
  convert: (amount: number) => amount,
  formatCurrency: (amount: number) => `USD ${amount.toFixed(2)}`,
  loading: true,
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Always start with USD to match server-side rendering (prevents hydration mismatch)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 }); // Default USD rate
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Initialize currency and fetch rates AFTER mount (client-side only)
  useEffect(() => {
    setMounted(true);
    
    async function initialize() {
      try {
        // Detect or load currency (this reads localStorage, so only on client)
        const detected = await detectCurrency();
        setSelectedCurrency(detected);

        // Fetch exchange rates
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/currency/rates`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.rates) {
            setRates(data.rates);
          }
        } else {
          // If API fails, at least ensure USD rate exists
          setRates({ USD: 1 });
        }
      } catch (error) {
        console.error('[CURRENCY] Failed to initialize:', error);
        // Fallback rates (all 1.0 for USD)
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/currency/rates`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.rates) {
            setRates(data.rates);
          }
        }
      } catch (error) {
        console.error('[CURRENCY] Failed to refresh rates:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const setCurrency = (currency: string) => {
    const upperCurrency = currency.toUpperCase();
    setSelectedCurrency(upperCurrency);
    saveCurrencyLocal(upperCurrency);
  };

  const convert = (amountUSD: number): number => {
    if (selectedCurrency === 'USD') {
      return amountUSD;
    }

    const rate = rates[selectedCurrency];
    if (!rate || rate === 0) {
      // Fallback: return USD amount if rate not available
      return amountUSD;
    }

    return amountUSD * rate;
  };

  const formatCurrency = (amount: number): string => {
    const currencyCode = selectedCurrency.toLowerCase();
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `${selectedCurrency} ${amount.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setCurrency,
        rates,
        convert,
        formatCurrency,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  return context;
}
