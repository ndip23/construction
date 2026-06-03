import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuthStore } from '../store/useAuthStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import apiClient from '../api/client';
import { t } from '../theme';
import {
  Briefcase, Wrench, ClipboardList, FileText,
  BarChart, Sparkles, MapPin, Store, Building2, Calculator, ArrowRight,
  Wallet, FolderKanban, CheckCircle2, TrendingUp, Plus, Receipt
} from 'lucide-react';

interface Overview {
  projects: { total: number; byStatus: Record<string, number> };
  budget: { total: number; spent: number; utilization: number };
  boq: {
    totalValue: number; verifiedValue: number; pendingValue: number;
    itemsTotal: number; itemsVerified: number; itemsPending: number; itemsRejected: number;
    verificationRate: number;
  };
}

const KpiCard = ({ icon: Icon, label, value, sub, tint }: any) => (
  <div className={`${t.statCard} flex flex-col gap-3`}>
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tint}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-2xl font-black text-foreground leading-none">{value}</p>
      <p className={`mt-1.5 ${t.label}`}>{label}</p>
      {sub && <p className="text-[11px] font-bold text-muted-foreground mt-1">{sub}</p>}
    </div>
  </div>
);

const DashboardCard = ({ icon: Icon, title, desc, path, delay, isPrimary, className }: any) => (
  <Link to={path} className={`group block relative overflow-hidden rounded-[2rem] border transition-all duration-300 hover:-translate-y-1 ${
    isPrimary
      ? 'bg-foreground text-background border-foreground shadow-xl'
      : 'bg-card text-foreground border-border shadow-sm hover:shadow-lg'
  } ${className}`}>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative z-10 h-full p-5 sm:p-8 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1rem] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
          isPrimary ? 'bg-background/10 text-primary' : 'bg-muted text-foreground'
        }`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 ${
          isPrimary ? 'bg-primary text-foreground' : 'bg-foreground text-background'
        }`}>
           <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div className="relative z-20">
        <h3 className={`text-base sm:text-xl font-black tracking-tight mb-1 sm:mb-2 ${isPrimary ? 'text-background' : 'text-foreground'}`}>
          {title}
        </h3>
        <p className={`text-[10px] sm:text-xs font-semibold leading-relaxed max-w-[90%] ${isPrimary ? 'text-background/70' : 'text-muted-foreground'}`}>
          {desc}
        </p>
      </div>

      <div className={`absolute -bottom-6 -right-6 pointer-events-none transition-transform duration-500 group-hover:scale-110 ${
        isPrimary ? 'opacity-5 text-background' : 'opacity-[0.03] text-foreground'
      }`}>
        <Icon size={140} />
      </div>
    </motion.div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuthStore();
  const { fromUSD, format } = useCurrencyStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  const { data } = useQuery<Overview>({
    queryKey: ['analytics-overview'],
    queryFn: async () => (await apiClient.get('/analytics/overview')).data,
  });

  const boq = data?.boq;
  const projects = data?.projects;
  const budget = data?.budget;

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-border pb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Workspace Active</span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight leading-tight">
              Good morning, {user?.name?.split(' ')[0] || 'Member'} 👋
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">
              {user?.company || 'BuildHub'} • Premium Tier
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-muted px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-foreground/50 w-full sm:w-auto justify-center">
              <MapPin size={16} className="text-primary" />
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <Link to="/dashboard/projects/new" className="bg-primary text-foreground hover:bg-primary-dim transition-all shadow-md px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 w-full sm:w-auto">
              <Plus size={18} /> New Project
            </Link>
          </div>
        </div>

        {/* LIVE KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KpiCard
            icon={Wallet}
            label="Total BOQ Value"
            value={boq ? money(boq.totalValue) : '—'}
            sub={boq ? `${boq.itemsVerified} verified` : ' '}
            tint="bg-primary-pale text-primary"
          />
          <KpiCard
            icon={FolderKanban}
            label="Active Projects"
            value={projects ? projects.total : '—'}
            sub={projects ? `${projects.byStatus['In Progress'] || 0} in progress` : ' '}
            tint="bg-indigo-500/10 text-indigo-400"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Verification Rate"
            value={boq ? `${Math.round(boq.verificationRate * 100)}%` : '—'}
            sub={boq ? `${boq.itemsVerified}/${boq.itemsTotal} items` : ' '}
            tint="bg-emerald-500/10 text-emerald-400"
          />
          <KpiCard
            icon={TrendingUp}
            label="Budget Used"
            value={budget ? `${Math.round(budget.utilization * 100)}%` : '—'}
            sub={budget ? money(budget.spent) : ' '}
            tint="bg-amber-500/10 text-amber-400"
          />
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">

          <DashboardCard
            icon={Briefcase}
            title="Project Pulse"
            desc="Monitor ongoing site operations, track progress, and manage daily field reports."
            path="/dashboard/projects"
            delay={0.05}
            isPrimary={true}
            className="sm:col-span-2 lg:col-span-2 xl:col-span-2"
          />

          <DashboardCard
            icon={Building2}
            title="Inquiries"
            desc="Manage directory leads and client messages."
            path="/dashboard/inquiries"
            delay={0.1}
          />

          <DashboardCard
            icon={Store}
            title="Marketplace"
            desc="Buy & sell heavy equipment and materials."
            path="/dashboard/marketplace"
            delay={0.15}
          />

          <DashboardCard
            icon={ClipboardList}
            title="Tenders"
            desc="Browse open tenders and submit bids."
            path="/dashboard/tenders"
            delay={0.2}
          />

          <DashboardCard
            icon={FileText}
            title="Invoices"
            desc="Create, send, and track financial invoices instantly."
            path="/dashboard/invoices"
            delay={0.25}
          />

          <DashboardCard
            icon={Receipt}
            title="Smart Receipts"
            desc="Generate, track, and download professional smart receipts."
            path="/dashboard/receipts"
            delay={0.27}
          />

          <DashboardCard
            icon={Calculator}
            title="BOQ Tool"
            desc="Generate professional Bills of Quantities."
            path="/dashboard/boq"
            delay={0.3}
          />

          <DashboardCard
            icon={Sparkles}
            title="AI Hub"
            desc="Leverage AI for engineering insights and safety."
            path="/dashboard/ai"
            delay={0.35}
            isPrimary={true}
            className="sm:col-span-2 lg:col-span-2"
          />

          <DashboardCard
            icon={BarChart}
            title="Analytics"
            desc="Live BOQ value, verification, budgets, and AI adoption."
            path="/dashboard/analytics"
            delay={0.4}
          />

          <DashboardCard
            icon={Wrench}
            title="Services"
            desc="Configure your service offerings and public profile."
            path="/dashboard/services"
            delay={0.45}
          />

        </div>

      </div>
    </DashboardShell>
  );
};

export default Dashboard;
