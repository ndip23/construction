import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  /** How many units equal 1 USD (approximate fixed rates — production would fetch live) */
  ratePerUSD: number;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'XAF', name: 'CFA Franc (Central Africa)', symbol: 'FCFA', ratePerUSD: 600 },
  { code: 'XOF', name: 'CFA Franc (West Africa)',    symbol: 'FCFA', ratePerUSD: 600 },
  { code: 'NGN', name: 'Nigerian Naira',              symbol: '₦',    ratePerUSD: 1600 },
  { code: 'GHS', name: 'Ghanaian Cedi',              symbol: 'GH₵',  ratePerUSD: 15 },
  { code: 'KES', name: 'Kenyan Shilling',            symbol: 'KSh',  ratePerUSD: 130 },
  { code: 'ZAR', name: 'South African Rand',         symbol: 'R',    ratePerUSD: 19 },
  { code: 'EGP', name: 'Egyptian Pound',             symbol: 'E£',   ratePerUSD: 48 },
  { code: 'USD', name: 'US Dollar',                  symbol: '$',    ratePerUSD: 1 },
  { code: 'EUR', name: 'Euro',                       symbol: '€',    ratePerUSD: 0.92 },
  { code: 'GBP', name: 'British Pound',              symbol: '£',    ratePerUSD: 0.79 },
];

interface CurrencyState {
  currency: Currency;
  /** Live units-per-USD by currency code, fetched from the backend FX endpoint */
  liveRates: Record<string, number> | null;
  ratesSource: 'live' | 'fallback' | 'static';
  setCurrency: (currency: Currency) => void;
  /** Fetch live FX rates from the backend (cached server-side for 1h) */
  loadRates: () => Promise<void>;
  /** Convert an amount from USD to the selected currency */
  fromUSD: (usdAmount: number) => number;
  /** Format a local-currency amount as a display string */
  format: (localAmount: number) => string;
}

const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0]; // XAF
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: DEFAULT_CURRENCY,
      liveRates: null,
      ratesSource: 'static',

      setCurrency: (currency) => set({ currency }),

      loadRates: async () => {
        try {
          const res = await fetch(`${API_URL}/fx/rates`);
          if (!res.ok) return;
          const data = await res.json();
          if (data?.rates) {
            set({ liveRates: data.rates, ratesSource: data.source === 'live' ? 'live' : 'fallback' });
          }
        } catch {
          // keep static fallback rates from SUPPORTED_CURRENCIES
        }
      },

      fromUSD: (usdAmount) => {
        const { currency, liveRates } = get();
        const rate = liveRates?.[currency.code] ?? currency.ratePerUSD;
        return Math.round(usdAmount * rate);
      },

      format: (localAmount) => {
        const { symbol, code } = get().currency;
        return `${symbol}${Number(localAmount).toLocaleString()} ${code}`;
      },
    }),
    {
      name: 'cpromark-currency',
      // Only persist the chosen currency; re-fetch live rates fresh each session
      partialize: (state) => ({ currency: state.currency }) as any,
    }
  )
);

// Fetch live rates once on app load (fire-and-forget)
useCurrencyStore.getState().loadRates();
