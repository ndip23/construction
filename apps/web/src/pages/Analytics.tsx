import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { t } from '../theme';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { motion } from 'framer-motion';
import {
  TrendingUp, CheckCircle2, Sparkles, Wallet, FolderKanban, Loader2, Brain,
} from 'lucide-react';

interface Overview {
  projects: { total: number; byStatus: Record<string, number> };
  budget: { total: number; spent: number; utilization: number };
  boq: {
    totalValue: number; verifiedValue: number; pendingValue: number;
    itemsTotal: number; itemsVerified: number; itemsPending: number; itemsRejected: number;
    verificationRate: number;
  };
  sources: Record<string, number>;
  aiAdoptionRate: number;
  topProjects: { name: string; budget: number; spent: number; utilization: number; boqValue: number }[];
  learning: { total: number; accepted: number; edited: number; rejected: number; acceptRate: number; accuracy: number | null };
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/* A minimal SVG progress ring */
const Ring = ({ value, color }: { value: number; color: string }) => {
  const r = 46, circ = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 110 110" className="w-32 h-32 -rotate-90">
      <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
      <circle
        cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(1, Math.max(0, value)))}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, tint }: any) => (
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

const statusColors: Record<string, string> = {
  Planning: 'bg-indigo-400', 'In Progress': 'bg-primary', Completed: 'bg-emerald-400', 'On Hold': 'bg-rose-400',
};
const sourceColors: Record<string, string> = {
  user: 'bg-foreground/60', marketplace: 'bg-blue-400', ai: 'bg-purple-400',
};

const Analytics = () => {
  const { fromUSD, format, currency } = useCurrencyStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  const { data, isLoading } = useQuery<Overview>({
    queryKey: ['analytics-overview'],
    queryFn: async () => (await apiClient.get('/analytics/overview')).data,
  });

  if (isLoading || !data) {
    return (
      <DashboardShell>
        <div className="p-20 text-center text-muted-foreground font-bold flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={18} /> Loading analytics…
        </div>
      </DashboardShell>
    );
  }

  const { projects, budget, boq, sources, aiAdoptionRate, topProjects, learning } = data;
  const maxBoq = Math.max(1, ...topProjects.map((p) => p.boqValue));
  const totalSourceItems = Math.max(1, Object.values(sources).reduce((a, b) => a + b, 0));

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto pb-20">
        <header className="mb-8">
          <h1 className={`${t.h2} italic`}>Analytics</h1>
          <p className={`${t.muted}`}>Live portfolio metrics · shown in {currency.code}</p>
        </header>

        {/* KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={Wallet} label="Total BOQ Value" value={money(boq.totalValue)}
            sub={`${money(boq.verifiedValue)} verified`} tint="bg-primary-pale text-primary" />
          <StatCard icon={FolderKanban} label="Projects" value={projects.total}
            sub={`${projects.byStatus['In Progress'] || 0} active`} tint="bg-indigo-500/10 text-indigo-400" />
          <StatCard icon={CheckCircle2} label="Verification" value={pct(boq.verificationRate)}
            sub={`${boq.itemsVerified}/${boq.itemsTotal} items`} tint="bg-emerald-500/10 text-emerald-400" />
          <StatCard icon={Sparkles} label="AI Adoption" value={pct(aiAdoptionRate)}
            sub={`${sources.ai || 0} AI items`} tint="bg-purple-500/10 text-purple-400" />
          <StatCard icon={TrendingUp} label="Budget Used" value={pct(budget.utilization)}
            sub={`${money(budget.spent)} / ${money(budget.total)}`} tint="bg-amber-500/10 text-amber-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* VERIFICATION RING */}
          <div className={`${t.cardLg} p-8 flex flex-col items-center justify-center`}>
            <h3 className={`${t.label} self-start mb-4`}>BOQ Verification</h3>
            <div className="relative flex items-center justify-center">
              <Ring value={boq.verificationRate} color="#10b981" />
              <div className="absolute text-center">
                <p className="text-3xl font-black text-foreground">{pct(boq.verificationRate)}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">verified</p>
              </div>
            </div>
            <div className="flex gap-4 mt-6 text-center">
              <div><p className="text-lg font-black text-emerald-500">{boq.itemsVerified}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Verified</p></div>
              <div><p className="text-lg font-black text-amber-500">{boq.itemsPending}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pending</p></div>
              <div><p className="text-lg font-black text-rose-500">{boq.itemsRejected}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rejected</p></div>
            </div>
          </div>

          {/* TOP PROJECTS BY BOQ VALUE */}
          <div className={`${t.cardLg} p-8 lg:col-span-2`}>
            <h3 className={`${t.label} mb-5`}>Top Projects by BOQ Value</h3>
            {topProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground font-medium py-8 text-center">No project data yet.</p>
            ) : (
              <div className="space-y-4">
                {topProjects.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-bold text-foreground truncate pr-3">{p.name}</span>
                      <span className="text-sm font-black text-foreground whitespace-nowrap">{money(p.boqValue)}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${(p.boqValue / maxBoq) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PROJECT STATUS */}
          <div className={`${t.cardLg} p-8`}>
            <h3 className={`${t.label} mb-5`}>Projects by Status</h3>
            <div className="space-y-3">
              {Object.entries(projects.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status] || 'bg-muted'}`} />
                  <span className="text-sm font-bold text-foreground/80 flex-1">{status}</span>
                  <span className="text-sm font-black text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ITEM SOURCE BREAKDOWN */}
          <div className={`${t.cardLg} p-8 lg:col-span-2`}>
            <h3 className={`${t.label} mb-5`}>Line Items by Source</h3>
            <div className="flex h-4 rounded-full overflow-hidden mb-5">
              {Object.entries(sources).map(([src, count]) => (
                count > 0 ? <div key={src} className={sourceColors[src] || 'bg-muted'} style={{ width: `${(count / totalSourceItems) * 100}%` }} /> : null
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(['user', 'marketplace', 'ai'] as const).map((src) => (
                <div key={src} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${sourceColors[src]}`} />
                  <div>
                    <p className="text-lg font-black text-foreground leading-none">{sources[src] || 0}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground capitalize">{src}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI LEARNING (feedback loop) */}
          <div className={`${t.cardLg} p-8`}>
            <h3 className={`${t.label} mb-5 flex items-center gap-2`}><Brain size={14} className="text-purple-400" /> AI Learning</h3>
            {learning.total === 0 ? (
              <p className="text-sm text-muted-foreground font-medium">
                No AI feedback yet. As you accept, edit, or reject AI prices, Cpromark learns your corrections and feeds them into future estimates.
              </p>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black text-foreground">
                    {learning.accuracy !== null ? pct(learning.accuracy) : '—'}
                  </span>
                  <span className={t.label}>AI accuracy</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium mb-5">
                  Based on {learning.total} correction{learning.total === 1 ? '' : 's'} you've made.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-lg font-black text-emerald-500">{learning.accepted}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Accepted</p></div>
                  <div><p className="text-lg font-black text-amber-500">{learning.edited}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Edited</p></div>
                  <div><p className="text-lg font-black text-rose-500">{learning.rejected}</p><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rejected</p></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Analytics;
