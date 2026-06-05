/**
 * /dashboard/wallet
 *
 * Full wallet page:
 *  – Balance card (always in user's chosen currency equivalent)
 *  – Top-up modal: enter USD → see live local-currency preview → redirect to Swychr
 *  – Transaction history table
 *  – Handles /dashboard/wallet/verify?transaction_id=… after Swychr redirect
 */
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '../store/useCurrencyStore';

import apiClient from '../api/client';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon, Plus, ArrowUpCircle, ArrowDownCircle,
  Loader2, CheckCircle2, AlertCircle, DollarSign, RefreshCw,
  ExternalLink, X, Clock, TrendingUp, Lock
} from 'lucide-react';

// ─── Country options that Swychr supports ────────────────────────
const COUNTRIES = [
  { code: 'CM', label: 'Cameroon (XAF)' },
  { code: 'SN', label: 'Senegal (XOF)' },
  { code: 'CI', label: "Côte d'Ivoire (XOF)" },
  { code: 'NG', label: 'Nigeria (NGN)' },
  { code: 'GH', label: 'Ghana (GHS)' },
  { code: 'KE', label: 'Kenya (KES)' },
  { code: 'ZA', label: 'South Africa (ZAR)' },
  { code: 'EG', label: 'Egypt (EGP)' },
  { code: 'US', label: 'United States (USD)' },
  { code: 'GB', label: 'United Kingdom (GBP)' },
];

const QUICK_USD = [5, 10, 20, 50, 100, 200];

type WalletTransaction = {
  type: 'credit' | 'debit' | string;
  amount: number;
  amountUSD?: number;
  currency?: string;
  note?: string;
  transactionId?: string;
  date?: string;
};

type VerifyResponse = {
  status: 'success' | 'pending' | string;
  balance?: number;
  alreadyCredited?: boolean;
};

// ─── VerifyBanner ─────────────────────────────────────────────────
const VerifyBanner = ({ txId, onSuccess }: { txId: string; onSuccess: () => void }) => {
  const qc = useQueryClient();
  const MAX = 20;
  const attemptsRef = useRef(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);

  const { data, isError } = useQuery<VerifyResponse, unknown, VerifyResponse, [string, string | null]>({
    queryKey: ['wallet-verify', txId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/wallet/topup-verify/${txId}`);
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX) setMaxAttemptsReached(true);
      return data as VerifyResponse;
    },
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      if (status === 'success' || attemptsRef.current >= MAX) return false;
      return 3000;
    },
    enabled: !!txId,
  });

  useEffect(() => {
    if (data?.status === 'success') {
      toast.success('Wallet topped up successfully!');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['wallet-history'] });
      // Onboarding progression handled elsewhere; just notify and refresh data here.
      onSuccess();
    }
  }, [data, qc, onSuccess]);

  if (data?.status === 'success') {
    return (
      <div className="flex items-center gap-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl px-5 py-4 mb-6">
        <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
        <p className="text-sm font-bold text-emerald-300">Payment confirmed! Your wallet has been credited.</p>
      </div>
    );
  }

  if (isError || maxAttemptsReached) {
    return (
      <div className="flex items-center gap-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl px-5 py-4 mb-6">
        <AlertCircle className="text-rose-400 shrink-0" size={20} />
        <p className="text-sm font-bold text-rose-300">Could not confirm payment automatically. Contact support if money was deducted.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl px-5 py-4 mb-6">
      <Loader2 className="text-primary animate-spin shrink-0" size={20} />
      <p className="text-sm font-bold text-primary">Verifying your payment… this takes a few seconds.</p>
    </div>
  );
};

// ─── TopUp Modal ──────────────────────────────────────────────────
const TopUpModal = ({ onClose, initialCountryCode, isCurrencyLocked }: { onClose: () => void; initialCountryCode?: string; isCurrencyLocked?: boolean }) => {
  const { setCurrency } = useCurrencyStore();
  const [usdAmount, setUsdAmount] = useState('');
  const [countryCode, setCountryCode] = useState(initialCountryCode || 'CM');
  const [ratePreview, setRatePreview] = useState<{ localAmount: number; currency: string } | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const usdValue = Number(usdAmount) || 0;

  // Live rate fetch whenever usdAmount or countryCode changes
  useEffect(() => {
    const usd = Number(usdAmount);
    if (!usd || usd <= 0) { setRatePreview(null); return; }
    const timer = setTimeout(async () => {
      setLoadingRate(true);
      try {
        const { data } = await apiClient.get('/wallet/rate', { params: { amount: usd, countryCode } });
        setRatePreview({ localAmount: data.localAmount, currency: data.currency });
        // Sync currency store with chosen country currency
        const match = SUPPORTED_CURRENCIES.find((c) => c.code === data.currency);
        if (match) setCurrency(match);
      } catch {
        // Fallback to local calculation
        const FALLBACK: Record<string, number> = {
          XAF: 600, XOF: 600, NGN: 1600, GHS: 15, KES: 130, ZAR: 19, EGP: 48, USD: 1, GBP: 0.79,
        };
        const curr = COUNTRIES.find((c) => c.code === countryCode)?.label.match(/\((\w+)\)/)?.[1] ?? 'XAF';
        const rate = FALLBACK[curr] ?? 600;
        setRatePreview({ localAmount: Math.ceil(usd * rate), currency: curr });
      } finally {
        setLoadingRate(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [usdAmount, countryCode]);

  const initiateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/wallet/topup-initiate', {
        amountUSD: usdValue,
        countryCode,
      });
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.paymentLink;
    },
    onError: (err: unknown) => {
      const message = axios.isAxiosError(err) ? (err.response?.data as { message?: string })?.message : undefined;
      toast.error(message || 'Failed to create payment link.');
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-card rounded-[2.5rem] w-full max-w-md shadow-2xl border border-border p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-2xl flex items-center justify-center">
              <WalletIcon size={20} className="text-primary" />
            </div>
            <h2 className="text-xl font-black text-white">Top Up Wallet</h2>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Country selector */}
        <div className="mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 flex items-center gap-2">
            Your Payment Country
            {isCurrencyLocked && <Lock size={12} className="text-black/30" />}
          </label>
          <select
            value={countryCode}
            disabled={isCurrencyLocked}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/5 rounded-2xl text-sm font-medium text-black border border-black/5 outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-white">{c.label}</option>
            ))}
          </select>
          {isCurrencyLocked && (
            <p className="text-[10px] text-white/30 mt-1">Currency is locked permanently after your first deposit.</p>
          )}
        </div>

        {/* Quick amounts */}
        <div className="mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">Quick Select (USD)</label>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_USD.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setUsdAmount(String(a))}
                className={`py-3 rounded-xl font-black text-sm transition-all ${String(a) === usdAmount ? 'bg-primary text-brand-navy' : 'bg-white/5 text-black/60 hover:bg-white/10 border border-black/5'}`}
              >
                ${a}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1.5 block">Custom Amount (USD)</label>
          <div className="relative">
            <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              type="number"
              min="1"
              placeholder="Enter amount in USD"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-white/5 rounded-2xl text-sm font-medium text-black placeholder-black/25 border border-black/5 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Conversion preview */}
        <AnimatePresence>
          {(ratePreview || loadingRate) && Number(usdAmount) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-primary/10 border border-primary/20 rounded-2xl px-5 py-4 mb-5 flex items-center justify-between"
            >
              <div className="flex items-center justify-between mb-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-foreground/40 font-black">Local payment preview</p>
                </div>
                {loadingRate ? (
                  <Loader2 size={20} className="text-primary animate-spin" />
                ) : (
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary leading-none">
                      {ratePreview?.localAmount?.toLocaleString()} {ratePreview?.currency}
                    </p>
                    <p className="text-xs text-foreground/40">for ${usdValue.toFixed(2)} USD</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => initiateMutation.mutate()}
          disabled={!usdAmount || Number(usdAmount) < 1 || initiateMutation.isPending}
          className="w-full py-4 bg-primary text-brand-navy rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-yellow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {initiateMutation.isPending
            ? <><Loader2 size={18} className="animate-spin" /> Creating payment link…</>
            : <><ExternalLink size={18} /> Pay ${usdValue.toFixed(2)} USD • local conversion shown</>
          }
        </button>

        <p className="text-center text-[11px] text-white/30 mt-4">
          Secured by Swychr · You will be redirected to complete payment
        </p>
      </motion.div>
    </motion.div>
  );
};

// ─── Main page ────────────────────────────────────────────────────
const Wallet = () => {
  const [showTopUp, setShowTopUp] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const txIdToVerify = searchParams.get('transaction_id');
  const { format, setCurrency } = useCurrencyStore();

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const { data } = await apiClient.get('/wallet/balance');
      return data;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!balanceData?.currency) return;
    const match = SUPPORTED_CURRENCIES.find((c) => c.code === balanceData.currency);
    if (match) setCurrency(match);
  }, [balanceData?.currency, setCurrency]);

  const { data: history, isLoading: historyLoading } = useQuery<WalletTransaction[], unknown, WalletTransaction[], ['wallet-history']>({
    queryKey: ['wallet-history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/wallet/history');
      return data as WalletTransaction[];
    },
  });

  const balance = balanceData?.balance ?? 0;
  const currency = balanceData?.currency ?? 'USD';
  // Whether the workspace currency is locked (after first top-up) — tolerate multiple possible keys
  const isCurrencyLocked = Boolean((balanceData as any)?.currencyLocked || (balanceData as any)?.isCurrencyLocked);

  // Compute total credited in USD where available, else use local amount as fallback
  const totalCredited = (history ?? []).filter((t) => t.type === 'credit').reduce((sum, t) => {
    const v = typeof t.amountUSD === 'number' ? t.amountUSD : (typeof t.amount === 'number' ? t.amount : 0);
    return sum + v;
  }, 0);

  return (
    <DashboardShell>
      <AnimatePresence>
        {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} initialCountryCode={balanceData?.countryCode} isCurrencyLocked={isCurrencyLocked} />}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto pb-20">
        {/* Verify banner after redirect */}
        {txIdToVerify && (
          <VerifyBanner
            txId={txIdToVerify}
            onSuccess={() => setSearchParams({})}
          />
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Workspace Wallet</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Fund your account to unlock BOQ exports, listings, and premium tools.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTopUp(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-brand-navy rounded-2xl font-black text-sm shadow-yellow hover:scale-[1.02] transition-all shrink-0"
          >
            <Plus size={18} /> Top Up Wallet
          </button>
        </div>

        {/* Balance + stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Balance card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 bg-card rounded-[2.5rem] border border-primary/20 p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-start justify-between mb-6 relative">
              <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center">
                <WalletIcon size={26} className="text-primary" />
              </div>
              <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Available balance</span>
            </div>
            {balanceLoading ? (
              <Loader2 size={32} className="animate-spin text-primary mb-2" />
            ) : (
              <div>
                <p className="text-5xl font-black text-foreground tracking-tighter mb-1">
                  {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className="text-2xl text-foreground/40 ml-2">{currency}</span>
                </p>
                <p className="text-sm text-foreground/40 font-medium">{format(balance)}</p>
              </div>
            )}
          </motion.div>

          {/* Quick stats */}
          <div className="space-y-4">
            <div className="bg-card rounded-[2rem] border border-border p-5">
  <div className="flex items-center gap-3 mb-2">
    <TrendingUp size={18} className="text-emerald-400" />
    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Total Credited</span>
  </div>
  <p className="text-xl font-black text-foreground">
    {historyLoading
      ? '…'
      : `${totalCredited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
    }
  </p>
</div>
            <div className="bg-card rounded-[2rem] border border-border p-5">
              <div className="flex items-center gap-3 mb-2">
                <Clock size={18} className="text-foreground/40" />
                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Transactions</span>
              </div>
              <p className="text-xl font-black text-foreground">
                {historyLoading ? '…' : (history?.length ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Top-up CTA banner when balance is 0 */}
        {!balanceLoading && balance === 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 mb-10 flex items-center justify-between gap-4">
            <div>
              <p className="font-black text-primary text-sm mb-0.5">Your wallet is empty</p>
              <p className="text-xs text-muted-foreground font-medium">Top up to unlock all platform features including BOQ exports and paid listings.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTopUp(true)}
              className="px-5 py-2.5 bg-primary text-brand-navy rounded-xl font-black text-xs shrink-0 hover:scale-105 transition-all"
            >
              Add Fund
            </button>
          </div>
        )}

        {/* Transaction history */}
        <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden">
          <div className="px-8 py-6 border-b border-border flex items-center justify-between">
            <h3 className="font-black text-foreground text-base">Transaction History</h3>
            <button
              type="button"
              onClick={() => {}}
              className="p-2 rounded-xl text-foreground/40 hover:text-primary hover:bg-white/5 transition-all"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-20 text-foreground/30">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : !history?.length ? (
            balance > 0 ? (
              <div className="px-8 py-5">
                <motion.div
                  key="synthetic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between px-0 py-5"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-500/15 text-emerald-400`}>
                      <ArrowUpCircle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">Top-up (recorded)</p>
                      <p className="text-[11px] text-foreground/40 font-medium">—</p>
                    </div>
                  </div>
                  <span className={`font-black text-sm text-emerald-400`}>+{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</span>
                </motion.div>
              </div>
            ) : (
              <div className="text-center py-20">
                <WalletIcon size={40} className="mx-auto text-foreground/15 mb-3" />
                <p className="text-foreground/40 font-bold text-sm">No transactions yet</p>
                <p className="text-muted-foreground/50 text-xs mt-1">Your top-ups and spending will appear here.</p>
              </div>
            )
          ) : (
            <div className="divide-y divide-brand-border">
              {history.map((tx, i) => (
                <motion.div
                  key={tx.transactionId || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-8 py-5 hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                      {tx.type === 'credit'
                        ? <ArrowUpCircle size={20} />
                        : <ArrowDownCircle size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{tx.note || (tx.type === 'credit' ? 'Top-up' : 'Debit')}</p>
                      <p className="text-[11px] text-foreground/40 font-medium">
                        {tx.date ? new Date(tx.date).toLocaleString() : '—'}
                        {tx.transactionId && <span className="ml-2 opacity-50 font-mono text-[10px]">{tx.transactionId.slice(-12)}</span>}
                      </p>
                    </div>
                  </div>
                  <span className={`font-black text-sm ${tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'credit' ? '+' : '−'}
                    {tx.type === 'credit' && tx.amountUSD != null
                      ? `${tx.amountUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD`
                      : `${Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${tx.currency ?? currency}`}
                    {tx.type === 'credit' && tx.amountUSD != null && tx.currency && tx.currency !== 'USD' ? ` • ${tx.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${tx.currency}` : ''}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
};

export default Wallet;
