import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'EUR' | 'USD' | 'PEN' | 'MXN';

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  rate: number;
}

const currenciesData: Record<Currency, CurrencyConfig> = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 1 },
  USD: { code: 'USD', symbol: '$', name: 'Dólar Americano', rate: 1.08 },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano', rate: 4.05 },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso Mexicano', rate: 18.50 },
};

interface CurrencyContextType {
  currency: Currency;
  currencyConfig: CurrencyConfig;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number) => string;
  currencies: Record<Currency, CurrencyConfig>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('superinka_currency');
    return (saved as Currency) || 'EUR';
  });

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('superinka_currency', newCurrency);
  };

  const currencyConfig = currenciesData[currency];

  const formatPrice = (amount: number): string => {
    const converted = amount * currencyConfig.rate;
    return `${currencyConfig.symbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyConfig,
        setCurrency,
        formatPrice,
        currencies: currenciesData,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
