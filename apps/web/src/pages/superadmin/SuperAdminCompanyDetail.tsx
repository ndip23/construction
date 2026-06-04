import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { DashboardShell } from '../../components/layout/DashboardShell';
import apiClient from '../../api/client';
import { t, statusBadge } from '../../theme';
import {
  ArrowLeft,
  Loader2,
  Building2,
  AlertTriangle,
  User,
  Wallet,
  Users,
  HardHat,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Owner {
  name: string;
  email: string;
}
interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}
interface Worker {
  _id: string;
  name: string;
  role: string;
  phone: string;
  payType: string;
  payRate: number;
  portalEnabled: boolean;
  createdAt: string;
}
interface Project {
  _id: string;
  name: string;
  status: string;
  budget: number;
  location: string;
  createdAt: string;
}
interface InvoiceBucket {
  count: number;
  total: number;
}
interface WalletTxn {
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  note: string;
  transactionId: string;
  date: string;
}
interface CompanyDetail {
  company: {
    _id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    status: string;
    isSuspended: boolean;
    suspendedReason: string;
    plan: string;
    walletBalance: number;
    currency: string;
    createdAt: string;
    owner: Owner | null;
  };
  team: TeamMember[];
  workers: Worker[];
  projects: Project[];
  invoices: {
    Paid: InvoiceBucket;
    Pending: InvoiceBucket;
    Overdue: InvoiceBucket;
  };
  walletHistory: WalletTxn[];
}

const roleBadge = (role: string) => {
  switch (role) {
    case 'superadmin':
      return t.badgeAmber;
    case 'admin':
      return t.badgeGreen;
    case 'owner':
      return t.badgeYellow;
    default:
      return t.badgeNavy;
  }
};

const planBadge = (plan: string) =>
  plan === 'enterprise' ? t.badgeAmber : plan === 'pro' ? t.badgeGreen : t.badgeNavy;

const SuperAdminCompanyDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery<CompanyDetail>({
    queryKey: ['sa-company', id],
    queryFn: async () => (await apiClient.get(`/superadmin/companies/${id}`)).data,
    enabled: !!id,
  });

  const BackLink = () => (
    <Link
      to="/superadmin/companies"
      className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-xs font-black uppercase tracking-widest"
    >
      <ArrowLeft size={16} />
      Back to Companies
    </Link>
  );

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="max-w-[1400px] mx-auto pb-20">
          <BackLink />
          <div className="bg-card border border-border rounded-[2.5rem] py-24 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                Loading company...
              </p>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (isError || !data?.company) {
    return (
      <DashboardShell>
        <div className="max-w-[1400px] mx-auto pb-20">
          <BackLink />
          <div className={t.emptyState}>
            <AlertTriangle className="mx-auto text-rose-400 mb-4" size={56} />
            <h3 className="text-xl font-black text-foreground">Company not found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This tenant may have been removed, or the link is invalid.
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const { company, team, workers, projects, invoices, walletHistory } = data;
  const cur = company.currency || '';

  const invoiceCards = [
    { key: 'Paid' as const, i: CheckCircle2, bg: 'bg-emerald-500', label: 'Paid' },
    { key: 'Pending' as const, i: Clock, bg: 'bg-amber-500', label: 'Pending' },
    { key: 'Overdue' as const, i: AlertCircle, bg: 'bg-rose-500', label: 'Overdue' },
  ];

  return (
    <DashboardShell>
      <div className="max-w-[1400px] mx-auto pb-20">
        <BackLink />

        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center text-foreground font-black shadow-lg shadow-yellow shrink-0">
              {company.name?.charAt(0)?.toUpperCase() || <Building2 size={22} />}
            </div>
            <div className="min-w-0">
              <h1 className={`${t.h2} truncate`}>{company.name}</h1>
              <p className={`${t.muted} mt-0.5`}>
                {[company.city, company.country].filter(Boolean).join(', ') || '—'}
                {company.slug ? ` • @${company.slug}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={statusBadge(company.status)}>{company.status}</span>
            {company.isSuspended && <span className={t.badgeRed}>Suspended</span>}
            <span className={planBadge(company.plan)}>{company.plan}</span>
          </div>
        </header>

        {company.isSuspended && company.suspendedReason && (
          <div className="mb-8 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5">
            <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-rose-400">
                Suspended
              </p>
              <p className="text-sm text-foreground/70 font-medium mt-1">
                {company.suspendedReason}
              </p>
            </div>
          </div>
        )}

        {/* OWNER + WALLET */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className={`${t.statCard} flex items-center gap-4`}>
            <div className={t.iconBoxNavy}>
              <User size={20} />
            </div>
            <div className="min-w-0">
              <p className={t.label}>Owner</p>
              <p className="font-black text-foreground truncate">
                {company.owner?.name || 'Unassigned'}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {company.owner?.email || '—'}
              </p>
            </div>
          </div>
          <div className={`${t.statCard} flex items-center gap-4`}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <Wallet size={20} />
            </div>
            <div className="min-w-0">
              <p className={t.label}>Wallet Balance</p>
              <p className="text-2xl font-black text-foreground tracking-tighter">
                {company.walletBalance?.toLocaleString() ?? '0'}
                <span className="text-[11px] text-muted-foreground font-bold ml-1.5">
                  {cur}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* INVOICE SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {invoiceCards.map((c) => {
            const bucket = invoices?.[c.key];
            return (
              <div
                key={c.key}
                className="bg-card border border-border p-6 rounded-3xl shadow-sm group hover:shadow-card transition-all"
              >
                <div
                  className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <c.i size={24} />
                </div>
                <p className={`${t.label} mb-1`}>{c.label}</p>
                <h3 className="text-2xl font-black text-foreground tracking-tighter">
                  {(bucket?.total ?? 0).toLocaleString()}
                  <span className="text-[11px] text-muted-foreground font-bold ml-1.5">
                    {cur}
                  </span>
                </h3>
                <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase tracking-tight">
                  {bucket?.count ?? 0} invoice{(bucket?.count ?? 0) === 1 ? '' : 's'}
                </p>
              </div>
            );
          })}
        </div>

        {/* TEAM */}
        <SectionTitle icon={Users} label={`Team (${team?.length ?? 0})`} />
        <TableShell minWidth="640px">
          <thead className={`${t.tableHead} border-b border-border`}>
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Joined</th>
            </tr>
          </thead>
          <tbody>
            {!team || team.length === 0 ? (
              <EmptyRow span={4} label="No team members" />
            ) : (
              team.map((m) => (
                <tr key={m._id} className={t.tableRow}>
                  <td className="px-6 py-4 font-black text-foreground">{m.name}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                    {m.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={roleBadge(m.role)}>{m.role}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-muted-foreground">
                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableShell>

        {/* WORKERS */}
        <SectionTitle icon={HardHat} label={`Workers (${workers?.length ?? 0})`} />
        <TableShell minWidth="760px">
          <thead className={`${t.tableHead} border-b border-border`}>
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Pay Type</th>
              <th className="px-6 py-4">Pay Rate</th>
              <th className="px-6 py-4 text-right">Portal</th>
            </tr>
          </thead>
          <tbody>
            {!workers || workers.length === 0 ? (
              <EmptyRow span={6} label="No workers" />
            ) : (
              workers.map((w) => (
                <tr key={w._id} className={t.tableRow}>
                  <td className="px-6 py-4 font-black text-foreground">{w.name}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                    {w.phone || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-foreground/80">
                    {w.role || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-foreground/80">
                    {w.payType || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-foreground">
                    {w.payRate?.toLocaleString() ?? '0'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={w.portalEnabled ? t.badgeGreen : t.badgeNavy}>
                      {w.portalEnabled ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableShell>

        {/* PROJECTS */}
        <SectionTitle icon={FolderKanban} label={`Projects (${projects?.length ?? 0})`} />
        <TableShell minWidth="640px">
          <thead className={`${t.tableHead} border-b border-border`}>
            <tr>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Budget</th>
              <th className="px-6 py-4 text-right">Location</th>
            </tr>
          </thead>
          <tbody>
            {!projects || projects.length === 0 ? (
              <EmptyRow span={4} label="No projects" />
            ) : (
              projects.map((p) => (
                <tr key={p._id} className={t.tableRow}>
                  <td className="px-6 py-4 font-black text-foreground">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className={statusBadge(p.status)}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-foreground">
                    {p.budget?.toLocaleString() ?? '0'}
                    <span className="text-[10px] text-muted-foreground font-bold ml-1">
                      {cur}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-muted-foreground">
                    {p.location || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableShell>

        {/* WALLET HISTORY */}
        <SectionTitle icon={Wallet} label="Wallet History" />
        {!walletHistory || walletHistory.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground font-bold">No wallet transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {walletHistory.map((tx, idx) => {
              const isCredit = tx.type === 'credit';
              return (
                <motion.div
                  key={tx.transactionId || idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                  className="bg-card border border-border rounded-3xl p-5 shadow-sm flex items-center gap-4"
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isCredit
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground text-sm capitalize">{tx.type}</p>
                    {tx.note && (
                      <p className="text-xs text-foreground/60 font-medium mt-0.5 break-words">
                        {tx.note}
                      </p>
                    )}
                    <p className="text-[10px] font-medium text-muted-foreground mt-1">
                      {tx.date ? new Date(tx.date).toLocaleString() : '—'}
                    </p>
                  </div>
                  <p
                    className={`font-black text-sm shrink-0 ${
                      isCredit ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isCredit ? '+' : '-'}
                    {tx.amount?.toLocaleString() ?? '0'}
                    <span className="text-[10px] text-muted-foreground font-bold ml-1">
                      {tx.currency || cur}
                    </span>
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-3 mb-4 mt-10">
    <div className={t.iconBoxNavy}>
      <Icon size={18} />
    </div>
    <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
      {label}
    </h2>
  </div>
);

const TableShell = ({
  children,
  minWidth,
}: {
  children: React.ReactNode;
  minWidth: string;
}) => (
  <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left" style={{ minWidth }}>
        {children}
      </table>
    </div>
  </div>
);

const EmptyRow = ({ span, label }: { span: number; label: string }) => (
  <tr>
    <td colSpan={span} className="py-12 text-center">
      <p className="text-sm text-muted-foreground font-bold">{label}</p>
    </td>
  </tr>
);

export default SuperAdminCompanyDetail;
