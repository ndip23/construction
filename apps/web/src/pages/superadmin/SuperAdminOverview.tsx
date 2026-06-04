import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DashboardShell } from '../../components/layout/DashboardShell';
import apiClient from '../../api/client';
import { t } from '../../theme';
import {
  Building2,
  Users,
  HardHat,
  Gavel,
  FolderKanban,
  ShoppingBag,
  Wallet,
  Activity,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Receipt,
  ScrollText,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Overview {
  companies: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    suspended: number;
  };
  users: number;
  workers: number;
  openTenders: number;
  projects: number;
  marketplaceGMV: number;
  walletFloat: number;
  systemHealth: string;
}

const SuperAdminOverview = () => {
  const { data, isLoading, isError, refetch } = useQuery<Overview>({
    queryKey: ['sa-overview'],
    queryFn: async () => (await apiClient.get('/superadmin/overview')).data,
  });

  const kpis = data
    ? [
        {
          t: 'Companies',
          v: data.companies.total.toLocaleString(),
          i: Building2,
          bg: 'bg-primary',
          s: `${data.companies.verified} verified • ${data.companies.pending} pending • ${data.companies.suspended} suspended`,
        },
        {
          t: 'Total Users',
          v: data.users.toLocaleString(),
          i: Users,
          bg: 'bg-purple-600',
          s: 'Identity records',
        },
        {
          t: 'Workers',
          v: data.workers.toLocaleString(),
          i: HardHat,
          bg: 'bg-sky-600',
          s: 'Field workforce',
        },
        {
          t: 'Open Tenders',
          v: data.openTenders.toLocaleString(),
          i: Gavel,
          bg: 'bg-amber-500',
          s: 'Live on marketplace',
        },
        {
          t: 'Projects',
          v: data.projects.toLocaleString(),
          i: FolderKanban,
          bg: 'bg-emerald-500',
          s: 'Across all tenants',
        },
        {
          t: 'Marketplace GMV',
          v: data.marketplaceGMV.toLocaleString(),
          i: ShoppingBag,
          bg: 'bg-rose-500',
          s: 'Gross merchandise value',
        },
        {
          t: 'Wallet Float',
          v: data.walletFloat.toLocaleString(),
          i: Wallet,
          bg: 'bg-indigo-600',
          s: 'Held across all wallets',
        },
        {
          t: 'System Health',
          v: data.systemHealth || '---',
          i: Activity,
          bg: 'bg-background',
          s: 'Platform status',
        },
      ]
    : [];

  const quickLinks = [
    {
      to: '/superadmin/companies',
      label: 'Companies',
      desc: 'Verify, suspend, plans & wallets',
      i: Building2,
    },
    {
      to: '/superadmin/users',
      label: 'Users',
      desc: 'Manage roles & access',
      i: Users,
    },
    {
      to: '/superadmin/finance',
      label: 'Finance',
      desc: 'Invoices & revenue',
      i: Receipt,
    },
    {
      to: '/superadmin/audit',
      label: 'Audit Log',
      desc: 'Platform activity trail',
      i: ScrollText,
    },
  ];

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        {/* HEADER */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2.5 bg-background rounded-2xl text-primary shadow-xl shadow-yellow">
                <ShieldCheck size={22} />
              </div>
              <h1 className={t.h2}>Platform Control</h1>
            </div>
            <p className={t.muted}>BuildHub Superadmin Console • Global Overview</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Activity size={14} className={isLoading ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isLoading ? 'Synchronizing...' : data?.systemHealth || 'Nominal'}
            </span>
          </div>
        </header>

        {isError ? (
          <div className={t.emptyState}>
            <AlertTriangle className="mx-auto text-rose-400 mb-4" size={56} />
            <h3 className="text-xl font-black text-foreground">Could not load overview</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              The platform metrics service did not respond.
            </p>
            <button onClick={() => refetch()} className={t.btnPrimary}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-card border border-border p-6 rounded-3xl shadow-sm h-[160px] flex items-center justify-center"
                    >
                      <Loader2 className="animate-spin text-foreground/15" />
                    </div>
                  ))
                : kpis.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-card transition-all"
                    >
                      <div
                        className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <s.i size={24} />
                      </div>
                      <p className={`${t.label} mb-1`}>{s.t}</p>
                      <h3 className="text-2xl font-black text-foreground tracking-tighter break-words">
                        {s.v}
                      </h3>
                      <p className="text-[10px] font-bold text-foreground/40 mt-2 tracking-tight">
                        {s.s}
                      </p>
                    </motion.div>
                  ))}
            </div>

            {/* QUICK LINKS */}
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {quickLinks.map((q) => (
                <Link
                  key={q.to}
                  to={q.to}
                  className="bg-card border border-border p-6 rounded-3xl shadow-sm group hover:shadow-card hover:border-primary/20 transition-all flex items-center gap-4"
                >
                  <div className={t.iconBoxNavy}>
                    <q.i size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground">{q.label}</p>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">
                      {q.desc}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0"
                  />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default SuperAdminOverview;
