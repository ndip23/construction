import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion} from 'framer-motion';
import { Skeleton } from '../components/ui/Skeleton'; // Assuming your skeleton is here
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../api/client';
import { 
  Briefcase, Wrench, ClipboardList, 
  FileText, Plus, ChevronRight, 
  BarChart, Sparkles, MapPin, Store, Building2, Calculator,
  Loader2, TrendingUp, MessageCircle, Lock, Wallet
} from 'lucide-react';

// --- SUB-COMPONENT: SHIMMERING STAT CARD ---
const StatCard = ({ icon: Icon, title, value, sub, iconBg, iconColor, isLoading }: any) => (
  <div className="bg-card border border-border p-5 rounded-3xl flex gap-4 shadow-sm hover:shadow-md transition-all">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
      {isLoading ? <Loader2 size={18} className="animate-spin opacity-20" /> : <Icon size={20} />}
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">{title}</p>
      {isLoading ? (
        <Skeleton className="h-6 w-20 mb-1" />
      ) : (
        <h3 className="text-xl font-black text-foreground tracking-tight">{value}</h3>
      )}
      <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>
    </div>
  </div>
);

const QuickAccess = ({ icon: Icon, label, bg, path, locked, onLockedClick }: any) => {
  return (
    <Link 
      to={path} 
      onClick={(e) => {
        if (locked) {
          e.preventDefault();
          if (onLockedClick) onLockedClick();
        }
      }}
      className={`flex flex-col items-center gap-2 cursor-pointer group shrink-0 relative ${locked ? 'opacity-50' : ''}`}
    >
      <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center ${bg} text-foreground shadow-sm transition-all group-hover:scale-[1.02] ${!locked && 'group-hover:scale-110 group-hover:shadow-lg group-hover:-translate-y-1'}`}>
        <Icon size={22} />
        {locked && (
          <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-sm border border-border">
            <Lock size={12} className="text-foreground/40" />
          </div>
        )}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${locked ? 'text-muted-foreground' : 'text-muted-foreground group-hover:text-primary'}`}>{label}</span>
    </Link>
  );
};



const Dashboard = () => {
  const { user } = useAuthStore();

  // 1. FETCH REAL PROJECTS (Limit to 5)
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: async () => {
      const { data } = await apiClient.get('/projects');
      return data.slice(0, 5);
    }
  });

  // 2. FETCH SUMMARY ANALYTICS
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/company/summary');
      return data;
    }
  });

  const [showWalletModal, setShowWalletModal] = useState(false);
  const navigate = useNavigate();

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => (await apiClient.get('/wallet/balance')).data,
    enabled: user?.role === 'owner',
    refetchInterval: 60000,
  });

  const getBalance = () => {
    if (walletData) return Number(walletData.balance || 0);
    if (summary) return Number(summary.balance || 0);
    return null;
  };

  const balance = getBalance();
  const isWalletZero = user?.role === 'owner' && (walletLoading || (balance !== null && balance <= 0));

  const handleLockedClick = () => {
    setShowWalletModal(true);
  };

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        
        {/* DYNAMIC HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-black text-foreground tracking-tight leading-tight">
                Good morning, {user?.name?.split(' ')[0] || 'Member'} 👋
            </h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1 italic">
                {user?.company || "Cprohub Workspace"} • Premium Tier
            </p>
          </motion.div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-card px-5 py-2.5 rounded-2xl border border-border text-[10px] font-black uppercase text-brand-muted shadow-sm">
               <MapPin size={14} className="text-primary" /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
             </div>
             <Link 
                to="/dashboard/projects/new" 
                className="bg-primary text-brand-navy px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-yellow hover:scale-[1.02] hover:scale-[1.02] transition-all flex items-center gap-2"
                onClick={(e) => {
                  if (isWalletZero) {
                    e.preventDefault();
                    handleLockedClick();
                  }
                }}
             >
               <Plus size={16} /> New Project
             </Link>
          </div>
        </div>
  {/* QUICK ACCESS BAR */}
        <div className="bg-card border border-border p-10 rounded-[3rem] flex justify-between shadow-premium mb-10 overflow-x-auto no-scrollbar gap-10">
          <QuickAccess icon={Building2} label="Inquiries" bg="bg-background" path="/dashboard/inquiries" locked={isWalletZero} onLockedClick={handleLockedClick} />
          <QuickAccess icon={Store} label="Market" bg="bg-emerald-500" path="/dashboard/marketplace" locked={isWalletZero} onLockedClick={handleLockedClick} />
          <QuickAccess icon={ClipboardList} label="Tenders" bg="bg-orange-500" path="/dashboard/tenders" locked={isWalletZero} onLockedClick={handleLockedClick} />
          <QuickAccess icon={FileText} label="Invoices" bg="bg-purple-600" path="/dashboard/invoices" locked={isWalletZero} onLockedClick={handleLockedClick} />
          <QuickAccess icon={Calculator} label="BOQ Tool" bg="bg-rose-500" path="/dashboard/boq" locked={isWalletZero} onLockedClick={handleLockedClick} />
          <QuickAccess icon={Briefcase} label="Projects" bg="bg-indigo-600" path="/dashboard/projects" locked={isWalletZero} onLockedClick={handleLockedClick} />
          <QuickAccess icon={Wrench} label="Services" bg="bg-primary" path="/dashboard/services" locked={isWalletZero} onLockedClick={handleLockedClick} />
          <QuickAccess icon={Sparkles} label="AI Hub" bg="bg-violet-600" path="/dashboard/ai" locked={isWalletZero} onLockedClick={handleLockedClick} />
          <QuickAccess icon={BarChart} label="Reports" bg="bg-rose-600" path="/dashboard/finance" locked={isWalletZero} onLockedClick={handleLockedClick} />
        </div>

        {/* TOP STATS GRID (WITH SKELETONS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
          <StatCard title="Active Sites" value={summary?.projectCount || '0'} sub="On-site operations" icon={Briefcase} iconBg="bg-primary-pale" iconColor="text-primary" isLoading={summaryLoading} />
          <StatCard title="New Inquiries" value={summary?.msgCount || '0'} sub="Directory leads" icon={MessageCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" isLoading={summaryLoading} />
          <StatCard title="Open Tenders" value={summary?.tenderCount || '0'} sub="Market matches" icon={ClipboardList} iconBg="bg-orange-50" iconColor="text-orange-600" isLoading={summaryLoading} />
          <StatCard title="Total Revenue" value={`$${summary?.totalIncome?.toLocaleString() || '0'}`} sub="Annual gross" icon={TrendingUp} iconBg="bg-purple-50" iconColor="text-purple-600" isLoading={summaryLoading} />
          <StatCard title="Outstanding" value={summary?.invoiceCount || '0'} sub="Pending payments" icon={FileText} iconBg="bg-rose-50" iconColor="text-rose-400" isLoading={summaryLoading} />
        </div>

        {/* PROJECT OVERVIEW & FINANCIAL SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Main Table Area */}
          <div className="lg:col-span-2 bg-card rounded-[2.5rem] border border-border p-8 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-foreground uppercase text-xs tracking-[0.2em]">Live Project Pulse</h3>
              <Link to="/dashboard/projects" className="text-[10px] font-black text-primary border-b-2 border-primary/10 hover:border-primary transition-all uppercase tracking-widest pb-1">View Portfolio</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] text-foreground/35 uppercase font-black tracking-[0.2em] border-b border-border">
                    <th className="pb-5">Site Identity</th>
                    <th className="pb-5">Execution Status</th>
                    <th className="pb-5">Milestones</th>
                    <th className="pb-5 text-right">Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projectsLoading ? (
                    [1, 2, 3, 4].map(i => (
                      <tr key={i}><td colSpan={4} className="py-4"><Skeleton className="h-10 w-full" /></td></tr>
                    ))
                  ) : projects?.map((p: any) => (
                    <motion.tr 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      key={p._id} 
                      className="text-xs font-bold text-foreground/70 hover:bg-muted transition-colors cursor-pointer group"
                    >
                      <td className="py-5 font-black text-foreground">{p.name}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          p.status === 'In Progress' ? 'bg-primary-pale text-primary' : 'bg-muted text-brand-navy/50'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }} animate={{ width: `${p.progress}%` }}
                              className="h-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.4)]" 
                           />
                        </div>
                      </td>
                      <td className="text-right flex items-center justify-end gap-3 text-foreground font-black">
                         ${p.budget?.toLocaleString()} 
                         <ChevronRight size={14} className="text-foreground/15 group-hover:text-primary transition-all" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary Area */}
          <div className="bg-card rounded-[2.5rem] border border-border p-10 flex flex-col items-center shadow-sm">
            <h3 className="font-black text-foreground uppercase text-xs tracking-[0.2em] w-full mb-10">Financial Telemetry</h3>
            
            <div className="relative w-52 h-52 flex items-center justify-center mb-10">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="104" cy="104" r="85" stroke="currentColor" strokeWidth="22" fill="transparent" className="text-slate-50" />
                 <motion.circle 
                    cx="104" cy="104" r="85" stroke="currentColor" strokeWidth="22" fill="transparent" 
                    strokeDasharray="534" 
                    initial={{ strokeDashoffset: 534 }}
                    animate={{ strokeDashoffset: 534 - (534 * 0.75) }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="text-primary" 
                 />
               </svg>
               <div className="absolute flex flex-col items-center">
                 <h2 className="text-3xl font-black text-foreground tracking-tighter italic">
                    {summaryLoading ? "..." : `$${(summary?.balance / 1000).toFixed(1)}k`}
                 </h2>
                 <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Available</p>
               </div>
            </div>

            <div className="w-full space-y-5">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-3 font-bold text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> 
                    <span className="uppercase tracking-widest text-[10px]">Total Revenue</span>
                </div>
                <span className="font-black text-foreground">${summary?.totalIncome?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-3 font-bold text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" /> 
                    <span className="uppercase tracking-widest text-[10px]">Total OpEx</span>
                </div>
                <span className="font-black text-foreground">${summary?.totalExpenses?.toLocaleString() || '0'}</span>
              </div>
              <Link to="/dashboard/finance" className="block text-center text-primary text-[10px] font-black uppercase tracking-[0.2em] pt-6 hover:underline">
                Open Financial Audit →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* WALLET MODAL */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowWalletModal(false)} />
          <div className="relative bg-card border border-border w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
              <Wallet size={32} />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Wallet Empty</h2>
            <p className="text-muted-foreground font-medium mb-8">
              Your wallet balance is currently 0. Please top up your wallet to access this feature and continue using platform services.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowWalletModal(false)}
                className="flex-1 py-4 bg-muted hover:bg-muted/80 text-foreground rounded-2xl font-black text-xs uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowWalletModal(false);
                  navigate('/dashboard/wallet');
                }}
                className="flex-1 py-4 bg-primary hover:bg-primary-dim text-brand-navy rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow transition-all"
              >
                Top Up Now
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default Dashboard;