import { SupportedCurrency } from '../types';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCY_MAP: Record<SupportedCurrency, CurrencyConfig> = {
  PKR: { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee', locale: 'en-PK' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'en-AE' },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', locale: 'en-SA' },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', locale: 'ar-EG' },
};

export function formatMoney(
  amount: number,
  currency: SupportedCurrency = 'PKR',
  showSymbol: boolean = true
): string {
  const config = CURRENCY_MAP[currency] || CURRENCY_MAP.PKR;
  const num = Math.round(amount);
  const formatted = new Intl.NumberFormat(config.locale).format(num);
  return showSymbol ? `${config.symbol} ${formatted}` : formatted;
}
