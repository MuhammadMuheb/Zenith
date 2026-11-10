import { CurrencyInfo, SupportedCurrency } from '../types';

export const DEFAULT_CURRENCIES: Record<SupportedCurrency, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateAgainstUSD: 1.0,
    flag: '🇺🇸',
    locale: 'en-US',
  },
  PKR: {
    code: 'PKR',
    symbol: '₨',
    name: 'Pakistani Rupee',
    rateAgainstUSD: 278.5,
    flag: '🇵🇰',
    locale: 'en-PK',
  },
  EGP: {
    code: 'EGP',
    symbol: 'E£',
    name: 'Egyptian Pound (EGX)',
    rateAgainstUSD: 49.3,
    flag: '🇪🇬',
    locale: 'ar-EG',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateAgainstUSD: 0.92,
    flag: '🇪🇺',
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rateAgainstUSD: 0.79,
    flag: '🇬🇧',
    locale: 'en-GB',
  },
};

export function convertFromUSD(
  amountInUSD: number,
  targetCurrency: SupportedCurrency,
  rates: Record<SupportedCurrency, number> = {
    USD: 1.0,
    PKR: 278.5,
    EGP: 49.3,
    EUR: 0.92,
    GBP: 0.79,
  }
): number {
  const rate = rates[targetCurrency] ?? 1.0;
  return amountInUSD * rate;
}

export function convertToUSD(
  amountInForeign: number,
  fromCurrency: SupportedCurrency,
  rates: Record<SupportedCurrency, number> = {
    USD: 1.0,
    PKR: 278.5,
    EGP: 49.3,
    EUR: 0.92,
    GBP: 0.79,
  }
): number {
  const rate = rates[fromCurrency] ?? 1.0;
  return amountInForeign / rate;
}

export function formatCurrencyValue(
  amountInUSD: number,
  targetCurrency: SupportedCurrency = 'USD',
  rates: Record<SupportedCurrency, number> = {
    USD: 1.0,
    PKR: 278.5,
    EGP: 49.3,
    EUR: 0.92,
    GBP: 0.79,
  },
  showDualUSD: boolean = false
): string {
  const info = DEFAULT_CURRENCIES[targetCurrency] || DEFAULT_CURRENCIES.USD;
  const converted = convertFromUSD(amountInUSD, targetCurrency, rates);

  // Format with commas and appropriate decimal places
  const formatted = new Intl.NumberFormat(info.locale, {
    minimumFractionDigits: targetCurrency === 'PKR' || targetCurrency === 'EGP' ? 0 : 0,
    maximumFractionDigits: 2,
  }).format(Math.round(converted * 100) / 100);

  const mainStr = `${info.symbol} ${formatted}`;

  if (showDualUSD && targetCurrency !== 'USD') {
    const usdFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amountInUSD);
    return `${mainStr} (${usdFormatted})`;
  }

  return mainStr;
}
