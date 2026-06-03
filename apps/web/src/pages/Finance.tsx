import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Download,
  Filter,
  DollarSign,
  PieChart,
  Calendar,
  Loader2,
  TrendingUp,
  Sparkles,
  Activity,
  Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';

const FinanceCard = ({ title, amount, trend, isPositive, isLoading, icon: Icon, isCurrency = true }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="bg-card/60 backdrop-blur-md border border-border p-6 rounded-[2.5rem] shadow-premium hover:shadow-card transition-all"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-primary/10 rounded-2xl text-primary">
        <Icon size={20} />
      </div>
      {!isLoading && trend !== undefined && (
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
          isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
        }`}>
          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}%
        </div>
      )}
    </div>
    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">{title}</p>
    <h3 className="text-3xl font-black text-foreground mt-1 tracking-tighter">
      {isLoading ? <Loader2 className="animate-spin text-foreground/15" size={24} /> : `${isCurrency ? '$' : ''}${amount?.toLocaleString()}`}
    </h3>
  </motion.div>
);

const InvoiceRow = ({ inv }: any) => {
  const statusStyles: any = {
    Paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Overdue: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  return (
    <tr className="group hover:bg-muted/50 transition-colors border-b border-border">
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
            <FileText size={18} />
          </div>
          <div>
            <p className="font-black text-foreground text-xs">{inv.invoiceNumber}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Issued {new Date(inv.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5 font-bold text-foreground/70 text-xs">{inv.client?.name || "Private Project"}</td>
      <td className="px-8 py-5 font-black text-foreground text-sm">${inv.totalAmount?.toLocaleString()}</td>
      <td className="px-8 py-5">
        <span className={`px-4 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${statusStyles[inv.status]}`}>
          {inv.status}
        </span>
      </td>
      <td className="px-8 py-5 text-right">
        <button className="p-2 text-foreground/35 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
          <Download size={18} />
        </button>
      </td>
    </tr>
  );
};

const Finance = () => {
  // 1. FETCH FINANCIAL SUMMARY
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/company/summary');
      return data;
    }
  });

  // 2. FETCH REAL INVOICES
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices-list'],
    queryFn: async () => {
      const { data } = await apiClient.get('/invoices');
      return data;
    }
  });

  // 3. FETCH AI FINANCE INSIGHTS
  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['finance-insights'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/company/finance-insights');
      return data;
    }
  });

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-1.5 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sync
              </span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Finance <span className="text-primary italic">Control.</span></h1>
            <p className="text-sm text-muted-foreground font-medium italic mt-2">Monitor cash flow, performance projections, and AI-driven insights.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-card px-5 py-3.5 rounded-2xl border border-border text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-2">
              <Calendar size={16} /> Last 30 Days
            </button>
            <Link to="/dashboard/invoices/new" className="bg-foreground text-background px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-brand-navy hover:scale-105 transition-all flex items-center gap-2">
              <Plus size={18} /> New Invoice
            </Link>
          </div>
        </header>

        {/* FINANCIAL STATS GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
          <FinanceCard icon={DollarSign} title="Total Revenue" amount={summary?.totalIncome || 0} trend="12.5" isPositive={true} isLoading={summaryLoading} />
          <FinanceCard icon={Activity} title="Outstanding" amount={summary?.outstanding || 0} trend="2.1" isPositive={false} isLoading={summaryLoading} />
          <FinanceCard icon={TrendingUp} title="Net Profit" amount={summary?.balance || 0} trend="8.4" isPositive={true} isLoading={summaryLoading} />
          <FinanceCard icon={PieChart} title="Operating Expenses" amount={summary?.totalExpenses || 0} trend="5.2" isPositive={false} isLoading={summaryLoading} />
          <FinanceCard icon={Briefcase} title="Active Services" amount={summary?.serviceCount || 0} isCurrency={false} isLoading={summaryLoading} />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="xl:col-span-2 space-y-8">
            {/* ALGORITHMIC CAPITAL INSIGHTS HUB */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-[3rem] shadow-premium border border-border overflow-hidden relative mb-8"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
              <div className="p-8 border-b border-border/50 flex justify-between items-center px-10">
                <h2 className="font-black text-foreground text-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles size={18} className="text-primary" />
                  </div>
                  Algorithmic Capital Insights
                </h2>
              </div>
              <div className="p-8 lg:p-10">
                {insightsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 size={40} className="animate-spin text-primary" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synthesizing Financial Data...</p>
                  </div>
                ) : (
                  <div className="flex flex-col xl:flex-row gap-8">
                    {/* HERO SCORE CARD */}
                    <div className="xl:w-1/3 bg-zinc-950 border border-primary/20 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">Financial Health Index</h3>
                      <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-primary/10"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          />
                          <path
                            className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                            strokeDasharray={`${insightsData?.insights?.performanceScore || 0}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-4xl font-black text-white">{insightsData?.insights?.performanceScore || 0}<span className="text-xl text-primary">%</span></span>
                        </div>
                      </div>
                      <p className="text-sm text-white/80 font-medium leading-relaxed max-w-[250px] relative z-10">
                        "{insightsData?.insights?.scoreSuggestion || "Upload more services to start generating a reliable financial health score."}"
                      </p>
                    </div>

                    {/* 2X2 ASYMMETRICAL GRID */}
                    <div className="xl:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-background/50 border border-border rounded-3xl p-6 hover:bg-card hover:shadow-card transition-all flex flex-col justify-between group">
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <TrendingUp size={18} />
                          </div>
                          <h3 className="font-black text-foreground mb-2 text-sm">Marketplace Yield Analysis</h3>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {insightsData?.insights?.productROI || "Data unavailable."}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-background/50 border border-border rounded-3xl p-6 hover:bg-card hover:shadow-card transition-all flex flex-col justify-between group">
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Briefcase size={18} />
                          </div>
                          <h3 className="font-black text-foreground mb-2 text-sm">Revenue Trajectory Forecast</h3>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {insightsData?.insights?.serviceProjection || "Data unavailable."}
                          </p>
                        </div>
                      </div>

                      <div className="bg-background/50 border border-border rounded-3xl p-6 hover:bg-card hover:shadow-card transition-all flex flex-col justify-between group">
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <DollarSign size={18} />
                          </div>
                          <h3 className="font-black text-foreground mb-2 text-sm">Capital Allocation Strategy</h3>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {insightsData?.insights?.investmentStrategy || "Data unavailable."}
                          </p>
                        </div>
                      </div>

                      <div className="bg-background/50 border border-border rounded-3xl p-6 hover:bg-card hover:shadow-card transition-all flex flex-col justify-between group">
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Activity size={18} />
                          </div>
                          <h3 className="font-black text-foreground mb-2 text-sm">Vulnerability Assessment</h3>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {insightsData?.insights?.operationalRisk || "Data unavailable."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* RECENT INVOICES TABLE */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/60 backdrop-blur-md rounded-[3rem] shadow-premium border border-border overflow-hidden"
            >
              <div className="p-8 border-b border-border flex justify-between items-center px-10">
                <h2 className="font-black text-foreground text-lg flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary" /> Recent Billing
                </h2>
                <button className="p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-all border border-border"><Filter size={18} /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/30 text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black">
                      <th className="px-10 py-5">Document</th>
                      <th className="px-10 py-5">Client</th>
                      <th className="px-10 py-5">Amount</th>
                      <th className="px-10 py-5">Status</th>
                      <th className="px-10 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {invoicesLoading ? (
                      <tr><td colSpan={5} className="py-20 text-center animate-pulse font-bold text-foreground/35">Fetching accounts...</td></tr>
                    ) : invoices?.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-muted-foreground font-medium">No invoices found for this period.</td></tr>
                    ) : invoices?.map((inv: any) => (
                      <InvoiceRow key={inv._id} inv={inv} />
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* PROFIT DISTRIBUTION CHART */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/60 backdrop-blur-md rounded-[3rem] shadow-premium border border-border p-10 h-fit"
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-black text-foreground text-lg">Expense Logic</h2>
              <PieChart size={20} className="text-primary" />
            </div>
            
            <div className="space-y-8">
              {summary?.expenseBreakdown && summary.expenseBreakdown.length > 0 ? (
                summary.expenseBreakdown.map((item: any, index: number) => {
                  const colors = ['bg-primary', 'bg-indigo-500', 'bg-rose-500', 'bg-emerald-500'];
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-[10px] font-black mb-3">
                        <span className="text-muted-foreground uppercase tracking-widest">{item.label}</span>
                        <span className="text-foreground">{item.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`h-full ${colors[index % colors.length]}`} 
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">No Expenses Tracked</p>
                  <p className="text-[10px] text-muted-foreground/60 font-medium">Record material purchases or service orders to see breakdown.</p>
                </div>
              )}
            </div>

            <div className="mt-12 p-8 bg-background border border-border rounded-[2.5rem] text-foreground shadow-inner">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cumulative Spending</p>
               <h4 className="text-3xl font-black">${summary?.totalExpenses?.toLocaleString() || '0.00'}</h4>
               <button className="mt-6 w-full py-3.5 bg-foreground text-background hover:bg-primary hover:text-brand-navy transition-all rounded-xl text-[10px] font-black uppercase tracking-widest">Analyze Variance</button>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Finance;