import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuthStore } from '../store/useAuthStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { TourModal } from '../components/dashboard/TourModal';
import apiClient from '../api/client';
import {
  Briefcase, ClipboardList, FileText, Users, Radar,
  BarChart, Sparkles, Store, Building2, Calculator, ArrowRight,
  Wallet, Receipt, MessageSquare
} from 'lucide-react';

// Types
interface Overview {
  projects: { total: number; byStatus: Record<string, number> };
  budget: { total: number; spent: number; utilization: number };
  boq: {
    totalValue: number; verifiedValue: number; pendingValue: number;
    itemsTotal: number; itemsVerified: number; itemsPending: number; itemsRejected: number;
    verificationRate: number;
  };
}

interface DashboardCardProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  path: string;
  delay: number;
  isPrimary?: boolean;
  className?: string;
  locked?: boolean;
  onLockedClick?: () => void;
}

// Dashboard Card Component
const DashboardCard = ({ 
  icon: Icon, 
  title, 
  desc, 
  path, 
  delay, 
  isPrimary = false, 
  className = '', 
  locked = false, 
  onLockedClick 
}: DashboardCardProps) => (
  <Link 
    to={path} 
    onClick={(e) => {
      if (locked) {
        e.preventDefault();
        if (onLockedClick) onLockedClick();
      }
    }}
   className={`group block relative overflow-hidden rounded-[2rem] border transition-all duration-300 hover:-translate-y-1 ${
  isPrimary
    ? 'bg-foreground text-background border-foreground shadow-xl'
    : 'bg-card text-foreground border-border shadow-sm hover:shadow-lg'
} ${className}`}
  >
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

// Main Dashboard Component
const Dashboard = () => {
  const { user } = useAuthStore();
  const { getHasSeenTour } = useOnboardingStore();
  const { format } = useCurrencyStore();
  const navigate = useNavigate();
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Prefetch overview data (kept for future use, explicitly unused to avoid TS error)
  useQuery<Overview>({
    queryKey: ['analytics-overview'],
    queryFn: async () => (await apiClient.get('/analytics/overview')).data,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => (await apiClient.get('/wallet/balance')).data,
    enabled: user?.role === 'owner',
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Memoized balance calculation
  const balance = useMemo(() => {
    if (walletData && !walletLoading) {
      return Number(walletData.balance || 0);
    }
    return null;
  }, [walletData, walletLoading]);

  const isWalletZero = user?.role === 'owner' && (walletLoading || (balance !== null && balance <= 0));

  // Format currency for display
  const formattedBalance = useMemo(() => {
    if (balance !== null && format) {
      return format(balance);
    }
    return 'Loading...';
  }, [balance, format]);

  const handleLockedClick = () => {
    setShowWalletModal(true);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardShell>
      <AnimatePresence>
        {user?.id && user.role === 'owner' && walletData?.balance > 0 && !getHasSeenTour(user.id) && (
          <TourModal />
        )}
      </AnimatePresence>
      
      <div className="max-w-[1600px] mx-auto pb-20">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-border pb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Workspace Active
              </span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight leading-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Member'} 👋
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">
              {user?.company || 'Cpromark Workspace'} • Premium Tier
            </p>
          </motion.div>

          {/* Display wallet balance for owner */}
          {user?.role === 'owner' && balance !== null && balance > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Wallet Balance</p>
                  <p className="text-xl font-black text-foreground">{formattedBalance}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* DASHBOARD CARDS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          <DashboardCard
            icon={Building2}
            title="Business Directory"
            desc="Manage your company profile and services."
            path="/dashboard/inquiries"
            delay={0.05}
            isPrimary={true}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={Store}
            title="Business Marketplace"
            desc="Sell heavy equipment and materials."
            path="/dashboard/marketplace"
            delay={0.4}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={Radar}
            title="Scraper"
            desc="Discover new leads and business tenders."
            path="/dashboard/opportunities"
            delay={0.15}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={Calculator}
            title="BOQ Tool"
            desc="Generate professional Bills of Quantities."
            path="/dashboard/boq"
            delay={0.1}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={ClipboardList}
            title="Opportunities"
            desc="Browse open opportunities and submit bids."
            path="/dashboard/tenders"
            delay={0.18}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={Sparkles}
            title="AI Hub"
            desc="Leverage AI for engineering insights and safety."
            path="/dashboard/ai"
            delay={0.2}
            isPrimary={true}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={Receipt}
            title="Smart Receipts"
            desc="Generate, track, and download professional receipts."
            path="/dashboard/receipts"
            delay={0.25}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={MessageSquare}
            title="Community"
            desc="Connect and share with construction professionals."
            path="/dashboard/community"
            delay={0.3}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={Briefcase}
            title="Project Pulse"
            desc="Monitor ongoing site operations and daily field reports."
            path="/dashboard/projects"
            delay={0.35}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />


          <DashboardCard
            icon={FileText}
            title="Invoices"
            desc="Create, send, and track financial invoices."
            path="/dashboard/invoices"
            delay={0.45}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={BarChart}
            title="Analytics"
            desc="Live BOQ value, budgets, and AI adoption metrics."
            path="/dashboard/analytics"
            delay={0.5}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />

          <DashboardCard
            icon={Users}
            title="Workers Management"
            desc="Payroll, attendance, timesheets, and team tasks."
            path="/dashboard/workers-management"
            delay={0.6}
            locked={isWalletZero} 
            onLockedClick={handleLockedClick}
          />
        </div>

        {/* WALLET MODAL */}
        <AnimatePresence>
          {showWalletModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
                onClick={() => setShowWalletModal(false)} 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-card border border-border w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                  <Wallet size={32} />
                </div>
                <h2 className="text-2xl font-black text-foreground mb-2">Wallet Empty</h2>
                <p className="text-muted-foreground font-medium mb-8">
                  Your wallet balance is currently 0. Please top up your wallet to access features and continue using platform services.
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
};

export default Dashboard;