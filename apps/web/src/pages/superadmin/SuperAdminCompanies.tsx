import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DashboardShell } from '../../components/layout/DashboardShell';
import apiClient from '../../api/client';
import { t, statusBadge } from '../../theme';
import { exportToCSV } from '../../utils/exporters';
import toast from 'react-hot-toast';
import {
  Search,
  Loader2,
  Inbox,
  Ban,
  RotateCcw,
  Wallet,
  Download,
  Eye,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Status = 'pending' | 'verified' | 'rejected';
type Plan = 'basic' | 'pro' | 'enterprise';

interface Company {
  _id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  status: Status;
  isSuspended: boolean;
  plan: Plan;
  walletBalance: number;
  currency: string;
  createdAt: string;
  owner: { name: string; email: string } | null;
}

const STATUS_FILTERS: Array<'all' | Status> = ['all', 'pending', 'verified', 'rejected'];
const PLANS: Plan[] = ['basic', 'pro', 'enterprise'];

const planBadge = (plan: Plan) =>
  plan === 'enterprise' ? t.badgeAmber : plan === 'pro' ? t.badgeGreen : t.badgeNavy;

const SuperAdminCompanies = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [walletTarget, setWalletTarget] = useState<Company | null>(null);

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ['sa-companies', search, status],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      return (await apiClient.get('/superadmin/companies', { params })).data;
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['sa-companies'] });

  const suspendMutation = useMutation({
    mutationFn: async ({
      id,
      suspend,
      reason,
    }: {
      id: string;
      suspend: boolean;
      reason: string;
    }) => apiClient.patch(`/superadmin/companies/${id}/suspend`, { suspend, reason }),
    // success/error toasts come from the apiClient interceptor (backend message)
    onSuccess: () => { invalidate(); },
  });

  const planMutation = useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: Plan }) =>
      apiClient.patch(`/superadmin/companies/${id}/plan`, { plan }),
    onSuccess: () => { invalidate(); },
  });

  const walletMutation = useMutation({
    mutationFn: async ({
      id,
      type,
      amount,
      note,
    }: {
      id: string;
      type: 'credit' | 'debit';
      amount: number;
      note: string;
    }) => apiClient.patch(`/superadmin/companies/${id}/wallet`, { type, amount, note }),
    onSuccess: () => {
      setWalletTarget(null);
      invalidate();
    },
  });

  const handleSuspendToggle = (c: Company) => {
    if (c.isSuspended) {
      suspendMutation.mutate({ id: c._id, suspend: false, reason: '' });
      return;
    }
    const reason = window.prompt(`Reason for suspending "${c.name}"?`);
    if (reason === null) return;
    suspendMutation.mutate({ id: c._id, suspend: true, reason: reason.trim() });
  };

  const handleExport = () => {
    exportToCSV(
      `buildhub-companies-${Date.now()}`,
      companies ?? [],
      [
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'City' },
        { key: 'country', label: 'Country' },
        { key: 'status', label: 'Status' },
        { key: 'plan', label: 'Plan' },
        { key: 'walletBalance', label: 'Wallet Balance' },
        { key: 'currency', label: 'Currency' },
        { key: 'owner.name', label: 'Owner Name' },
        { key: 'owner.email', label: 'Owner Email' },
      ]
    );
  };

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className={t.h2}>Companies</h1>
            <p className={t.muted}>
              Manage {companies?.length ?? 0} tenants — verification, plans & wallets.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-80 bg-card border border-border rounded-2xl px-4 py-2.5 flex items-center gap-3 focus-within:ring-2 ring-primary/20 transition-all shadow-sm">
              <Search size={18} className="text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company or owner..."
                className="bg-transparent border-none outline-none text-xs w-full font-medium"
              />
            </div>
            <button
              onClick={handleExport}
              className={`${t.btnSecondary} flex items-center gap-2 shrink-0`}
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </header>

        {/* STATUS PILLS */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                status === s
                  ? 'bg-primary text-brand-navy border-primary shadow-yellow'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[920px]">
              <thead className={`${t.tableHead} border-b border-border`}>
                <tr>
                  <th className="px-6 py-5">Company</th>
                  <th className="px-6 py-5">Owner</th>
                  <th className="px-6 py-5">Plan</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Wallet</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                          Loading companies...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : !companies || companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <Inbox className="mx-auto text-muted-foreground/30 mb-4" size={56} />
                      <h3 className="text-lg font-black text-muted-foreground">No companies found</h3>
                      <p className="text-sm text-foreground/40 mt-1">
                        Adjust your search or status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {companies.map((c) => (
                      <motion.tr
                        key={c._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={t.tableRow}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-background rounded-2xl flex items-center justify-center text-foreground font-black text-xs shadow-lg shadow-yellow shrink-0">
                              {c.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-foreground font-black truncate">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight mt-0.5">
                                {[c.city, c.country].filter(Boolean).join(', ') || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-foreground/90 font-bold text-xs">
                            {c.owner?.name || 'Unassigned'}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[180px]">
                            {c.owner?.email || '—'}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <select
                            value={c.plan}
                            disabled={planMutation.isPending}
                            onChange={(e) =>
                              planMutation.mutate({ id: c._id, plan: e.target.value as Plan })
                            }
                            className={`${planBadge(c.plan)} cursor-pointer outline-none disabled:opacity-50`}
                          >
                            {PLANS.map((p) => (
                              <option key={p} value={p} className="bg-card text-foreground">
                                {p}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-1.5">
                            <span className={statusBadge(c.status)}>{c.status}</span>
                            {c.isSuspended && <span className={t.badgeRed}>Suspended</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-foreground font-black text-sm">
                            {c.walletBalance?.toLocaleString() ?? '0'}
                            <span className="text-[10px] text-muted-foreground font-bold ml-1">
                              {c.currency}
                            </span>
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/superadmin/companies/${c._id}`}
                              title="View details"
                              className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary-pale rounded-xl transition-all border border-transparent hover:border-border"
                            >
                              <Eye size={18} />
                            </Link>
                            <button
                              onClick={() => setWalletTarget(c)}
                              title="Adjust wallet"
                              className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary-pale rounded-xl transition-all border border-transparent hover:border-border"
                            >
                              <Wallet size={18} />
                            </button>
                            <button
                              onClick={() => handleSuspendToggle(c)}
                              disabled={suspendMutation.isPending}
                              title={c.isSuspended ? 'Reinstate' : 'Suspend'}
                              className={`p-2.5 rounded-xl transition-all border border-transparent hover:border-border disabled:opacity-50 ${
                                c.isSuspended
                                  ? 'text-emerald-400 hover:bg-emerald-500/10'
                                  : 'text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10'
                              }`}
                            >
                              {c.isSuspended ? <RotateCcw size={18} /> : <Ban size={18} />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* WALLET MODAL */}
      <AnimatePresence>
        {walletTarget && (
          <WalletModal
            company={walletTarget}
            isPending={walletMutation.isPending}
            onClose={() => setWalletTarget(null)}
            onSubmit={(type, amount, note) =>
              walletMutation.mutate({ id: walletTarget._id, type, amount, note })
            }
          />
        )}
      </AnimatePresence>
    </DashboardShell>
  );
};

const WalletModal = ({
  company,
  isPending,
  onClose,
  onSubmit,
}: {
  company: Company;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (type: 'credit' | 'debit', amount: number, note: string) => void;
}) => {
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    onSubmit(type, num, note.trim());
  };

  return (
    <div className={t.overlay} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className={t.modal}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className={t.h3}>Adjust Wallet</h2>
            <p className={`${t.muted} mt-1`}>
              {company.name} • Balance {company.walletBalance?.toLocaleString()} {company.currency}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {(['credit', 'debit'] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setType(tp)}
                className={`py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${
                  type === tp
                    ? tp === 'credit'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {tp}
              </button>
            ))}
          </div>
          <div>
            <label className={`${t.label} block mb-2`}>Amount ({company.currency})</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={t.input}
              autoFocus
            />
          </div>
          <div>
            <label className={`${t.label} block mb-2`}>Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for adjustment"
              className={t.input}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={`${t.btnSecondary} flex-1`}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={`${t.btnPrimary} flex-1 disabled:opacity-50`}>
              {isPending ? 'Saving...' : 'Apply'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SuperAdminCompanies;
