import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { DashboardShell } from '../components/layout/DashboardShell';
import {
  Plus,
  Download,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MoreVertical,
  FileCheck,
  Lock,
  Loader2,
  X,
  Wand2,
  ScanSearch,
  AlertTriangle,
  Copy,
  ArrowLeftRight,
  PackagePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { t } from '../theme';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '../store/useCurrencyStore';
import { useAuthStore } from '../store/useAuthStore';
import { getCurrencyByCountry, getVatByCurrency } from '../lib/locations';

type Confidence = 'high' | 'medium' | 'low';

interface MarketplaceMatch {
  name: string;
  price: number;
  unit: string;
  supplier?: string;
  category?: string;
}

interface Suggestion {
  rate: number;
  unit: string;
  justification: string;
  confidence: Confidence;
  location?: string | null;
  vatRate?: number;
  marketplaceMatches?: MarketplaceMatch[];
  pricedFrom?: 'marketplace+ai' | 'ai';
}

const confidenceStyles: Record<Confidence, string> = {
  high: t.badgeGreen,
  medium: t.badgeAmber,
  low: t.badgeRed,
};

type SuggestionType = 'missing' | 'duplicate' | 'alternative' | 'outlier';

interface BOQSuggestion {
  type: SuggestionType;
  severity: Confidence;
  title: string;
  detail: string;
  relatedItems?: string[];
  item?: { description: string; unit: string; qty: number; rate: number };
}

const typeMeta: Record<SuggestionType, { label: string; icon: any; badge: string }> = {
  missing: { label: 'Missing item', icon: PackagePlus, badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
  duplicate: { label: 'Duplicate', icon: Copy, badge: t.badgeAmber },
  alternative: { label: 'Alternative', icon: ArrowLeftRight, badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  outlier: { label: 'Price outlier', icon: AlertTriangle, badge: t.badgeRed },
};

const ConfidenceBadge = ({ level }: { level?: Confidence }) => {
  if (!level) return null;
  return (
    <span className={confidenceStyles[level]}>
      {level} confidence
    </span>
  );
};

const BOQRow = ({ item, onVerify, isVerifying, money }: any) => {
  const statusColors: any = {
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    verified: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rejected: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-muted/50 transition-colors border-b border-border">
      <td className="px-6 py-4 text-sm font-medium text-muted-foreground">#</td>
      <td className="px-6 py-4">
        <div>
          <p className="text-sm font-bold text-foreground">{item.description}</p>
          {item.source === 'ai' && (
            <span className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-purple-500">
                <Sparkles size={10} /> AI Suggested
              </span>
              <ConfidenceBadge level={item.confidence} />
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-foreground/70 font-medium">{item.unit}</td>
      <td className="px-6 py-4 text-sm text-foreground font-bold">{item.qty}</td>
      <td className="px-6 py-4 text-sm text-foreground font-bold">{money(item.rate)}</td>
      <td className="px-6 py-4 text-sm text-foreground font-black">{money(item.qty * item.rate)}</td>
      <td className="px-6 py-4">
        <button
          onClick={() => onVerify(item._id)}
          disabled={item.status === 'verified' || isVerifying}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase transition-all ${statusColors[item.status]}`}
        >
          {isVerifying ? <Loader2 size={12} className="animate-spin" /> : item.status === 'verified' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
          {item.status}
        </button>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-foreground/35 hover:text-foreground"><MoreVertical size={18} /></button>
      </td>
    </motion.tr>
  );
};

/* ------------------------------------------------------------------ */
/* AI ESTIMATOR MODAL: suggest -> confidence -> accept / edit / reject */
/* ------------------------------------------------------------------ */
const AIEstimatorModal = ({ onClose, onAccepted, defaultProjectId }: { onClose: () => void; onAccepted: () => void; defaultProjectId?: string }) => {
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [qty, setQty] = useState('1');
  const [rate, setRate] = useState('');          // editable: holds suggested rate, user can override
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  // Projects for the "insert into" target
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
  });

  // Localised money display (amounts are stored in USD)
  const { fromUSD, format, setCurrency } = useCurrencyStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  // When a project is chosen, switch the display currency to its country's currency
  const selectProject = (id: string) => {
    setProjectId(id);
    const proj = (projects || []).find((p: any) => p._id === id);
    const code = getCurrencyByCountry(proj?.country);
    const cur = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (cur) setCurrency(cur);
  };

  // If scoped to a project, sync the currency once projects load
  useEffect(() => {
    if (defaultProjectId && projects) {
      const proj = (projects || []).find((p: any) => p._id === defaultProjectId);
      const cur = SUPPORTED_CURRENCIES.find((c) => c.code === getCurrencyByCountry(proj?.country));
      if (cur) setCurrency(cur);
    }
  }, [defaultProjectId, projects]);

  // 1. Ask the AI for a price
  const suggestMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post('/boq/suggest-pricing', { description, unit, projectId })).data as Suggestion,
    onSuccess: (data) => {
      setSuggestion(data);
      setRate(String(data.rate));
      if (!unit) setUnit(data.unit);
    },
  });

  // 2. Accept -> insert into the chosen project's BOQ as an AI-sourced item
  const acceptMutation = useMutation({
    mutationFn: async () =>
      apiClient.post(`/boq/project/${projectId}/item`, {
        description,
        unit: unit || suggestion?.unit,
        qty: Number(qty),
        rate: Number(rate),
        source: 'ai',
        suggestedRate: suggestion?.rate,
        confidence: suggestion?.confidence,
        aiJustification: suggestion?.justification,
      }),
    onSuccess: () => {
      onAccepted();
      onClose();
    },
  });

  const edited = suggestion && Number(rate) !== suggestion.rate;
  const canSuggest = description.trim().length > 0;
  const canAccept = !!suggestion && !!projectId && Number(qty) > 0 && Number(rate) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={t.overlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="bg-card border border-border rounded-[3rem] w-full max-w-lg shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`${t.h3} flex items-center gap-2`}>
            <Wand2 size={20} className="text-purple-500" /> AI Price Estimator
          </h3>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground"><X size={20} /></button>
        </div>

        {/* Target project */}
        <label className={`block mb-1.5 ${t.label}`}>Add to project <span className="text-purple-500 normal-case tracking-normal">(sets pricing region)</span></label>
        <select
          value={projectId}
          onChange={(e) => selectProject(e.target.value)}
          className={`${t.select} mb-4`}
        >
          <option value="">Select a project…</option>
          {(projects || []).map((p: any) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        {/* Item description */}
        <label className={`block mb-1.5 ${t.label}`}>Item description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. 32.5N Portland cement, 50kg bag"
          className={`${t.input} mb-4`}
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={`block mb-1.5 ${t.label}`}>Unit (optional)</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="bag / m³ / unit"
              className={t.input}
            />
          </div>
          <div>
            <label className={`block mb-1.5 ${t.label}`}>Qty</label>
            <input
              type="number" min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className={t.input}
            />
          </div>
        </div>

        <button
          onClick={() => suggestMutation.mutate()}
          disabled={!canSuggest || suggestMutation.isPending}
          className={`w-full flex items-center justify-center gap-2 ${t.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {suggestMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {suggestion ? 'Re-estimate' : 'Get AI Price'}
        </button>

        {/* Suggestion result: accept / edit / reject */}
        <AnimatePresence>
          {suggestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-6 border border-border rounded-2xl p-5 bg-muted/40"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={t.label}>
                  {suggestion.pricedFrom === 'marketplace+ai' ? 'Marketplace-anchored' : 'AI Estimate'}
                  {suggestion.location ? ` · ${suggestion.location}` : ''}
                </span>
                <ConfidenceBadge level={suggestion.confidence} />
              </div>

              <p className="text-sm text-foreground/80 mb-4 italic">“{suggestion.justification}”</p>

              {/* AI vs marketplace comparison */}
              {suggestion.marketplaceMatches && suggestion.marketplaceMatches.length > 0 && (
                <div className="mb-4 border border-border rounded-xl overflow-hidden">
                  <div className={`bg-muted px-3 py-2 ${t.micro} text-muted-foreground`}>
                    Marketplace reference prices (USD)
                  </div>
                  {suggestion.marketplaceMatches.map((m, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 text-xs border-t border-border first:border-t-0">
                      <span className="font-bold text-foreground/80 truncate pr-2">{m.name}{m.supplier ? <span className="text-foreground/40 font-medium"> · {m.supplier}</span> : null}</span>
                      <span className="font-black text-foreground whitespace-nowrap">${m.price}/{m.unit}</span>
                    </div>
                  ))}
                </div>
              )}

              {suggestion.vatRate !== undefined && (
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-4 px-1">
                  <span>VAT ({(suggestion.vatRate * 100).toFixed(1)}%)</span>
                  <span>+ {money(Number(qty) * Number(rate || 0) * suggestion.vatRate)}</span>
                </div>
              )}

              <div className="flex items-end gap-3 mb-5">
                <div className="flex-1">
                  <label className={`block mb-1.5 ${t.label}`}>
                    Rate (USD) {edited && <span className="text-purple-500 normal-case tracking-normal">(edited)</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/50 font-bold">$</span>
                    <input
                      type="number" min={0}
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className={`${t.input} font-bold`}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className={`block mb-1.5 ${t.label}`}>Line total</span>
                  <span className="text-lg font-black text-foreground">
                    {money(Number(qty) * Number(rate || 0))}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => acceptMutation.mutate()}
                  disabled={!canAccept || acceptMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {acceptMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Accept &amp; Add
                </button>
                <button
                  onClick={() => {
                    // Learning loop: record the rejection (fire-and-forget)
                    if (suggestion) {
                      apiClient.post('/boq/feedback/reject', {
                        description,
                        aiSuggestedRate: suggestion.rate,
                        location: suggestion.location,
                        confidence: suggestion.confidence,
                        projectId: projectId || undefined,
                      }).catch(() => {});
                    }
                    setSuggestion(null);
                    setRate('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 ${t.btnSecondary}`}
                >
                  <X size={14} /> Reject
                </button>
              </div>
              {!projectId && (
                <p className={`${t.micro} text-amber-500 mt-3 text-center`}>Select a project above to accept this price.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* AI BOQ ANALYSIS: review a project -> missing/duplicate/alt/outlier  */
/* ------------------------------------------------------------------ */
const AIAnalyzePanel = ({ onClose, onChanged, defaultProjectId }: { onClose: () => void; onChanged: () => void; defaultProjectId?: string }) => {
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [suggestions, setSuggestions] = useState<BOQSuggestion[] | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set());

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
  });

  const { fromUSD, format, setCurrency } = useCurrencyStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  const selectProject = (id: string) => {
    setProjectId(id);
    setSuggestions(null);
    const proj = (projects || []).find((p: any) => p._id === id);
    const cur = SUPPORTED_CURRENCIES.find((c) => c.code === getCurrencyByCountry(proj?.country));
    if (cur) setCurrency(cur);
  };

  const analyzeMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post(`/boq/project/${projectId}/analyze`)).data.suggestions as BOQSuggestion[],
    onSuccess: (data) => { setSuggestions(data); setAdded(new Set()); },
  });

  const addMutation = useMutation({
    mutationFn: async (item: BOQSuggestion['item']) =>
      apiClient.post(`/boq/project/${projectId}/item`, {
        description: item!.description,
        unit: item!.unit,
        qty: item!.qty,
        rate: item!.rate,
        source: 'ai',
      }),
    onSuccess: () => onChanged(),
  });

  const dismiss = (idx: number) =>
    setSuggestions((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={t.overlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="bg-card border border-border rounded-[3rem] w-full max-w-xl shadow-2xl p-8 max-h-[85vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`${t.h3} flex items-center gap-2`}>
            <ScanSearch size={20} className="text-primary" /> BOQ Analysis
          </h3>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground"><X size={20} /></button>
        </div>

        <label className={`block mb-1.5 ${t.label}`}>Project to review</label>
        <div className="flex gap-3 mb-2">
          <select value={projectId} onChange={(e) => selectProject(e.target.value)} className={t.select}>
            <option value="">Select a project…</option>
            {(projects || []).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={!projectId || analyzeMutation.isPending}
            className={`shrink-0 flex items-center justify-center gap-2 ${t.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {analyzeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ScanSearch size={16} />}
            Analyze
          </button>
        </div>

        {suggestions && suggestions.length === 0 && (
          <div className="mt-6 text-center py-10">
            <CheckCircle className="mx-auto text-emerald-500 mb-3" size={32} />
            <p className="text-sm font-bold text-foreground">No issues found — this BOQ looks complete.</p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <AnimatePresence>
            {suggestions?.map((s, idx) => {
              const meta = typeMeta[s.type];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                  className="border border-border rounded-2xl p-4 bg-muted/40"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${meta.badge}`}>
                      <Icon size={11} /> {meta.label}
                    </span>
                    <ConfidenceBadge level={s.severity} />
                  </div>
                  <p className="text-sm font-black text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.detail}</p>

                  {s.relatedItems && s.relatedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.relatedItems.map((r, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-foreground/60">{r}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    {s.item && (
                      <button
                        onClick={() => { addMutation.mutate(s.item); setAdded((p) => new Set(p).add(idx)); }}
                        disabled={added.has(idx) || addMutation.isPending}
                        className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                      >
                        {added.has(idx) ? <CheckCircle size={12} /> : <Plus size={12} />}
                        {added.has(idx) ? 'Added' : `Add ${s.item.qty} ${s.item.unit} @ ${money(s.item.rate)}`}
                      </button>
                    )}
                    <button onClick={() => dismiss(idx)} className={t.btnGhost}>Dismiss</button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* MANUAL ADD ITEM MODAL: pick project -> describe -> qty/rate -> save  */
/* ------------------------------------------------------------------ */
const AddItemModal = ({ onClose, onAdded, defaultProjectId }: { onClose: () => void; onAdded: () => void; defaultProjectId?: string }) => {
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [qty, setQty] = useState('1');
  const [rate, setRate] = useState('');

  // Projects for the "insert into" target
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
  });

  // Localised money display (amounts are stored in USD)
  const { fromUSD, format, setCurrency } = useCurrencyStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  // When a project is chosen, switch the display currency to its country's currency
  const selectProject = (id: string) => {
    setProjectId(id);
    const proj = (projects || []).find((p: any) => p._id === id);
    const cur = SUPPORTED_CURRENCIES.find((c) => c.code === getCurrencyByCountry(proj?.country));
    if (cur) setCurrency(cur);
  };

  // If scoped to a project, sync the currency once projects load
  useEffect(() => {
    if (defaultProjectId && projects) {
      const proj = (projects || []).find((p: any) => p._id === defaultProjectId);
      const cur = SUPPORTED_CURRENCIES.find((c) => c.code === getCurrencyByCountry(proj?.country));
      if (cur) setCurrency(cur);
    }
  }, [defaultProjectId, projects]);

  const addMutation = useMutation({
    mutationFn: async () =>
      apiClient.post(`/boq/project/${projectId}/item`, {
        description,
        unit,
        qty: Number(qty),
        rate: Number(rate),
        source: 'user',
      }),
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  const canAdd =
    !!projectId &&
    description.trim().length > 0 &&
    Number(qty) > 0 &&
    rate !== '' &&
    Number(rate) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={t.overlay}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="bg-card border border-border rounded-[3rem] w-full max-w-lg shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`${t.h3} flex items-center gap-2`}>
            <PackagePlus size={20} className="text-primary" /> Add BOQ Item
          </h3>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground"><X size={20} /></button>
        </div>

        {/* Target project */}
        <label className={`block mb-1.5 ${t.label}`}>Add to project <span className="text-primary normal-case tracking-normal">(sets currency region)</span></label>
        <select
          value={projectId}
          onChange={(e) => selectProject(e.target.value)}
          className={`${t.select} mb-4`}
        >
          <option value="">Select a project…</option>
          {(projects || []).map((p: any) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        {/* Item description */}
        <label className={`block mb-1.5 ${t.label}`}>Item description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. 32.5N Portland cement, 50kg bag"
          className={`${t.input} mb-4`}
        />

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className={`block mb-1.5 ${t.label}`}>Unit</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="bag / m³"
              className={t.input}
            />
          </div>
          <div>
            <label className={`block mb-1.5 ${t.label}`}>Qty</label>
            <input
              type="number" min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className={t.input}
            />
          </div>
          <div>
            <label className={`block mb-1.5 ${t.label}`}>Rate (USD)</label>
            <input
              type="number" min={0}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0.00"
              className={`${t.input} font-bold`}
            />
          </div>
        </div>

        {/* Live line-total preview */}
        <div className="flex items-center justify-between border border-border rounded-2xl p-5 bg-muted/40 mb-6">
          <span className={t.label}>Line total</span>
          <span className="text-lg font-black text-foreground">
            {money(Number(qty || 0) * Number(rate || 0))}
          </span>
        </div>

        <button
          onClick={() => addMutation.mutate()}
          disabled={!canAdd || addMutation.isPending}
          className={`w-full flex items-center justify-center gap-2 ${t.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {addMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add Item
        </button>
        {!projectId && (
          <p className={`${t.micro} text-amber-500 mt-3 text-center`}>Select a project above to add this item.</p>
        )}
      </motion.div>
    </motion.div>
  );
};

const BOQEngine = () => {
  const queryClient = useQueryClient();
  const [showEstimator, setShowEstimator] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Open the estimator when navigated here with ?estimate=1 (e.g. from the AI hub)
  useEffect(() => {
    if (searchParams.get('estimate')) {
      setShowEstimator(true);
      searchParams.delete('estimate');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // 1. FETCH REAL BOQ DATA (GET /boq returns an array of BOQ docs for the company)
  const { data: boqData, isLoading } = useQuery({
    queryKey: ['boq-items'],
    queryFn: async () => {
      const { data } = await apiClient.get('/boq');
      return data;
    }
  });

  // 2. VERIFY ITEM MUTATION
  const verifyMutation = useMutation({
    mutationFn: (itemId: string) => apiClient.put(`/boq/verify/${itemId}`, { status: 'verified' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boq-items'] })
  });

  const refetchBOQ = () => queryClient.invalidateQueries({ queryKey: ['boq-items'] });

  // Project list for the scoping switcher
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
  });

  // Active project scope — driven by the ?project= query param ('' = All projects)
  const scopedProjectId = searchParams.get('project') || '';
  const setScopedProject = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('project', id);
    else next.delete('project');
    setSearchParams(next, { replace: true });
  };

  const boqList: any[] = Array.isArray(boqData) ? boqData : (boqData ? [boqData] : []);

  // The BOQ doc for the scoped project (when scoped)
  const scopedBoq = scopedProjectId
    ? boqList.find((boq: any) => boq.project?._id === scopedProjectId)
    : undefined;

  // Items: scoped to one project, or flattened across all company BOQs
  const items = scopedProjectId
    ? (scopedBoq?.items || [])
    : boqList.flatMap((boq: any) => (boq.items || []));

  const scopedProject = (projects || []).find((p: any) => p._id === scopedProjectId);
  const scopedProjectName = scopedProject?.name || scopedBoq?.project?.name || '';
  const scopedLocked = !!scopedBoq?.isLocked;

  const allVerified = items.length > 0 && items.every((item: any) => item.status === 'verified');
  const subtotal = items.reduce((acc: number, item: any) => acc + (item.qty * item.rate), 0);

  // Display money in the chosen currency (amounts are stored in USD)
  const { currency, setCurrency, fromUSD, format } = useCurrencyStore();
  const { user } = useAuthStore();
  const money = (usd: number) => format(fromUSD(usd || 0));
  const vatRate = getVatByCurrency(currency.code);
  const vatAmount = subtotal * vatRate;

  // Money formatted for the PDF. Use the currency code (Latin) rather than the
  // symbol, since jsPDF's default font cannot render glyphs like ₦ / GH₵ / E£.
  const moneyPdf = (usd: number) =>
    `${Number(fromUSD(usd || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency.code}`;

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const marginX = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightX = pageWidth - marginX;
    const NAVY: [number, number, number] = [0, 21, 41];
    const YELLOW: [number, number, number] = [245, 197, 24];
    const company = user?.company || 'BuildHub';

    // --- Branded navy header band ---
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 96, 'F');
    // Yellow "BH" logo mark
    doc.setFillColor(...YELLOW);
    doc.roundedRect(marginX, 30, 36, 36, 7, 7, 'F');
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('BH', marginX + 8, 54);
    // Brand name + document title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.text(company, marginX + 50, 48);
    doc.setTextColor(...YELLOW);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL OF QUANTITIES', marginX + 50, 63);
    // Right-aligned meta in header
    doc.setTextColor(200, 210, 220);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Generated  ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, rightX, 44, { align: 'right' });
    doc.text(`Currency  ${currency.code}`, rightX, 57, { align: 'right' });
    doc.text(`Status  All items verified`, rightX, 70, { align: 'right' });

    // --- Items table (branded) ---
    autoTable(doc, {
      startY: 120,
      head: [['#', 'Description', 'Unit', 'Qty', 'Rate', 'Line Total']],
      body: items.map((item: any, i: number) => [
        String(i + 1),
        item.description,
        item.unit || '',
        String(item.qty),
        moneyPdf(item.rate),
        moneyPdf(item.qty * item.rate),
      ]),
      styles: { fontSize: 9, cellPadding: 7, textColor: [30, 41, 59], lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8, cellPadding: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 26, textColor: [148, 163, 184] },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: marginX, right: marginX },
    });

    // --- Totals block ---
    const finalY = (doc as any).lastAutoTable?.finalY ?? 120;
    let y = finalY + 26;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal', rightX - 170, y);
    doc.setTextColor(30, 41, 59);
    doc.text(moneyPdf(subtotal), rightX, y, { align: 'right' });

    y += 18;
    doc.setTextColor(100, 116, 139);
    doc.text(`VAT (${(vatRate * 100).toFixed(1)}%)`, rightX - 170, y);
    doc.setTextColor(30, 41, 59);
    doc.text(moneyPdf(vatAmount), rightX, y, { align: 'right' });

    // Navy total bar
    y += 14;
    doc.setFillColor(...NAVY);
    doc.roundedRect(rightX - 240, y, 240, 34, 6, 6, 'F');
    doc.setTextColor(...YELLOW);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL (INCL. VAT)', rightX - 228, y + 21);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(moneyPdf(subtotal + vatAmount), rightX - 12, y + 22, { align: 'right' });

    // --- Footer (yellow rule + note) on every page ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setDrawColor(...YELLOW);
      doc.setLineWidth(2);
      doc.line(marginX, pageHeight - 40, marginX + 40, pageHeight - 40);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Generated by BuildHub — Construction Operating System', marginX, pageHeight - 26);
      doc.text(`Page ${p} of ${pageCount}`, rightX, pageHeight - 26, { align: 'right' });
    }

    doc.save(`boq-${company.replace(/[^\w]+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (isLoading) return <div className="p-20 text-center font-bold text-muted-foreground animate-pulse">Loading BOQ Engine...</div>;

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight italic">BOQ Estimation Engine</h1>
            {scopedProjectId ? (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-brand-muted text-sm font-medium">{scopedProjectName || 'Project'}</p>
                {scopedLocked ? (
                  <span className={`${t.badgeGreen} flex items-center gap-1`}><Lock size={10} /> Locked</span>
                ) : (
                  <span className={t.badgeAmber}>Active</span>
                )}
              </div>
            ) : (
              <p className="text-brand-muted text-sm font-medium">Verify AI suggestions and market rates before exporting.</p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={scopedProjectId}
              onChange={(e) => setScopedProject(e.target.value)}
              className="bg-card border border-border text-foreground px-4 py-3 rounded-2xl font-bold text-xs hover:bg-muted transition-all max-w-[200px]"
              title="Scope to a project"
            >
              <option value="">All projects</option>
              {(projects || []).map((p: any) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <select
              value={currency.code}
              onChange={(e) => {
                const c = SUPPORTED_CURRENCIES.find((x) => x.code === e.target.value);
                if (c) setCurrency(c);
              }}
              className="bg-card border border-border text-foreground px-4 py-3 rounded-2xl font-bold text-xs hover:bg-muted transition-all"
              title="Display currency"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAnalyze(true)}
              className="flex items-center gap-2 bg-card border border-border text-foreground px-6 py-3 rounded-2xl font-bold text-xs hover:bg-muted transition-all"
            >
              <ScanSearch size={16} className="text-primary" /> Analyze BOQ
            </button>
            <button
              onClick={() => setShowEstimator(true)}
              className="flex items-center gap-2 bg-card border border-border text-foreground px-6 py-3 rounded-2xl font-bold text-xs hover:bg-muted transition-all"
            >
              <Wand2 size={16} className="text-purple-500" /> AI Estimate
            </button>
            <button
              onClick={() => setShowAddItem(true)}
              className="bg-card border border-border text-foreground px-6 py-3 rounded-2xl font-bold text-xs hover:bg-muted transition-all"
            >
              <Plus size={18} className="inline mr-2" /> Add Item
            </button>
            <button
              onClick={() => navigate('/dashboard/ai')}
              className="flex items-center gap-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-xs hover:opacity-90 transition-all shadow-lg"
            >
              <Sparkles size={16} /> Create a BOQ with AI
            </button>
            <button
              onClick={exportPDF}
              disabled={!allVerified}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs transition-all shadow-xl ${
                allVerified ? "bg-primary text-brand-navy hover:bg-primary-dim" : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {allVerified ? <Download size={18} /> : <Lock size={18} />} Export PDF
            </button>
          </div>
        </header>

        <AnimatePresence>
          {!allVerified && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-amber-500" size={20} />
              <p className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                Export Locked: All line items must be verified by a human before finalization.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">#</th>
                  <th className="px-6 py-5">Description</th>
                  <th className="px-6 py-5">Unit</th>
                  <th className="px-6 py-5">Qty</th>
                  <th className="px-6 py-5">Rate</th>
                  <th className="px-6 py-5">Total</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm font-bold text-muted-foreground">
                      No BOQ items yet. Use <span className="text-purple-500">AI Estimate</span> to suggest a price.
                    </td>
                  </tr>
                ) : (
                  items.map((item: any) => (
                    <BOQRow
                      key={item._id}
                      item={item}
                      onVerify={verifyMutation.mutate}
                      isVerifying={verifyMutation.isPending}
                      money={money}
                    />
                  ))
                )}
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td colSpan={5} className="px-6 pt-6 pb-1 text-right font-bold text-muted-foreground uppercase text-[11px]">Subtotal</td>
                  <td className="px-6 pt-6 pb-1 font-bold text-base text-foreground/70">{money(subtotal)}</td>
                  <td colSpan={2}></td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-6 py-1 text-right font-bold text-muted-foreground uppercase text-[11px]">
                    VAT ({(vatRate * 100).toFixed(1)}%)
                  </td>
                  <td className="px-6 py-1 font-bold text-base text-foreground/70">{money(vatAmount)}</td>
                  <td colSpan={2}></td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-6 pt-2 pb-8 text-right font-black text-foreground uppercase text-xs">Total (incl. VAT)</td>
                  <td className="px-6 pt-2 pb-8 font-black text-3xl text-foreground">{money(subtotal + vatAmount)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* AI PANEL */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-background p-10 rounded-[3.5rem] text-foreground relative overflow-hidden shadow-2xl">
              <Sparkles className="absolute right-[-20px] top-[-20px] text-foreground/5 w-64 h-64" />
              <div className="relative z-10">
                 <h3 className="text-2xl font-bold mb-2">BuildHub AI Estimator</h3>
                 <p className="text-muted-foreground text-sm mb-8 max-w-md">Our AI cross-references marketplace data and previous projects to suggest accurate rates and review your BOQ for gaps.</p>
                 <div className="flex flex-wrap items-center gap-3">
                   <button
                     onClick={() => setShowAnalyze(true)}
                     className="flex items-center gap-2 bg-primary text-brand-navy px-8 py-3 rounded-xl font-bold text-xs hover:bg-primary-dim transition-all"
                   >
                     <ScanSearch size={16} /> Analyze BOQ
                   </button>
                   <button
                     onClick={() => setShowEstimator(true)}
                     className="flex items-center gap-2 bg-card/10 border border-border/40 text-foreground px-8 py-3 rounded-xl font-bold text-xs hover:bg-card/20 transition-all"
                   >
                     <Wand2 size={16} /> Estimate a Price
                   </button>
                 </div>
              </div>
           </div>

           <div className="bg-card border border-border p-10 rounded-[3.5rem] border border-border flex flex-col items-center text-center justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 mb-6">
                 <FileCheck size={32} />
              </div>
              <h4 className="font-bold text-foreground">Accuracy Guaranteed</h4>
              <p className="text-xs text-muted-foreground mt-2">Verified items ensure 100% financial compliance and accurate profit forecasting.</p>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showEstimator && (
          <AIEstimatorModal onClose={() => setShowEstimator(false)} onAccepted={refetchBOQ} defaultProjectId={scopedProjectId || undefined} />
        )}
        {showAnalyze && (
          <AIAnalyzePanel onClose={() => setShowAnalyze(false)} onChanged={refetchBOQ} defaultProjectId={scopedProjectId || undefined} />
        )}
        {showAddItem && (
          <AddItemModal onClose={() => setShowAddItem(false)} onAdded={refetchBOQ} defaultProjectId={scopedProjectId || undefined} />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
};

export default BOQEngine;
