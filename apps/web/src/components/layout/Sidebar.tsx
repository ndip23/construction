import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Building2, Briefcase, Store,
  ClipboardList, FileText, Calculator, Landmark,
  Users, Sparkles, Files, Settings, Crown, HardHat, ShieldCheck, BarChart3, LogOut,
  Inbox, Lock, Wallet, Receipt, KeyRound, Radar, MessageSquare
} from 'lucide-react';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number | null;
  onNavigate?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  locked?: boolean;
  blockNavigation?: boolean;
  onBlockNavigation?: () => void;
}

const NavItem = ({ icon: Icon, label, path, badge, onNavigate, locked, blockNavigation, onBlockNavigation }: NavItemProps) => {
  // If locked is true, it shows the padlock. We are passing 'false' to this now.
  if (locked) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-0.5 opacity-35 cursor-not-allowed select-none">
        <div className="flex items-center gap-3">
          <Icon size={18} className="shrink-0" />
          <span className="text-[13px] font-medium tracking-tight">{label}</span>
        </div>
        <Lock size={12} className="text-foreground/40" />
      </div>
    );
  }

  return (
    <NavLink
      to={path}
      end={path === '/dashboard' || path === '/admin' || path === '/staff/dashboard'}
      onClick={(e) => {
        if (blockNavigation) {
          e.preventDefault();
          if (onBlockNavigation) {
            onBlockNavigation();
          } else {
            toast.error("Wallet is 0. Refill account before anything is done.");
          }
          return;
        }
        if (onNavigate) onNavigate(e);
      }}
      className={({ isActive }) => `
        flex items-center justify-between px-4 py-2.5 rounded-xl transition-all mb-0.5 group
        ${isActive
          ? 'bg-primary text-brand-navy shadow-lg shadow-yellow-900/20'
          : 'text-foreground/70 hover:bg-white/5 hover:text-primary'}
      `}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="shrink-0" />
        <span className="text-[13px] font-medium tracking-tight">{label}</span>
      </div>
      {badge != null && badge > 0 && (
        <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-md font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { user, logout } = useAuthStore();
  const { getHasSeenTour } = useOnboardingStore();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const navigate = useNavigate();

  const role = user?.role;
  const userId = user?.id || (user as any)?._id;
  const onboarded = userId ? getHasSeenTour(userId) : true;

  const { data: pendingQueue } = useQuery({
    queryKey: ['admin-pending-count'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/pending');
      return data;
    },
    enabled: role === 'admin',
    refetchInterval: 30000,
  });

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await apiClient.get('/auth/company/summary')).data,
    enabled: role === 'owner',
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => (await apiClient.get('/wallet/balance')).data,
    enabled: role === 'owner',
    refetchInterval: 60000,
  });

  // DB-LEVEL AUTO-ADVANCE: removed

  const isOwner = role === 'owner';
  const isWalletZero = isOwner && walletData && walletData.balance === 0;

  const getBlockProps = (path: string) => {
    return {
      blockNavigation: isWalletZero && path !== '/dashboard/wallet' && path !== '/dashboard',
      onBlockNavigation: () => setShowWalletModal(true)
    };
  };

  return (
    <aside className="w-[min(280px,85vw)] sm:w-[260px] h-[100dvh] bg-background text-foreground flex flex-col p-4 overflow-y-auto no-scrollbar border-r border-border/5">
      {/* LOGO */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-black text-brand-navy text-xs italic">CP</div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">Cpromark</h2>
      </div>

      {/* Setup banner is hidden when navLocked is false */}

      <nav className="flex-1">
        {/* ADMIN */}
        {role === 'admin' && (
          <>
            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-4 mb-2">Platform Master</p>
            <NavItem icon={LayoutDashboard} label="Dashboard" path="/admin" onNavigate={onNavigate} />
            <NavItem icon={ShieldCheck} label="Verification Queue" path="/admin/verifications" onNavigate={onNavigate} badge={pendingQueue?.length ?? null} />
            <NavItem icon={Users} label="Manage Companies" path="/admin/users" onNavigate={onNavigate} />
            <NavItem icon={BarChart3} label="System Stats" path="/admin/stats" onNavigate={onNavigate} />
            <NavItem icon={Settings} label="Global Settings" path="/admin/settings" onNavigate={onNavigate} />
          </>
        )}

        {/* SUPERADMIN — platform owner */}
        {role === 'superadmin' && (
          <>
            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-4 mb-2">Platform Owner</p>
            <NavItem icon={LayoutDashboard} label="Overview" path="/superadmin" onNavigate={onNavigate} />
            <NavItem icon={Building2} label="Companies" path="/superadmin/companies" onNavigate={onNavigate} />
            <NavItem icon={Users} label="Users" path="/superadmin/users" onNavigate={onNavigate} />
            <NavItem icon={Landmark} label="Finance" path="/superadmin/finance" onNavigate={onNavigate} />
            <NavItem icon={KeyRound} label="Login Monitor" path="/superadmin/logins" onNavigate={onNavigate} />
            <NavItem icon={ShieldCheck} label="Audit Log" path="/superadmin/audit" onNavigate={onNavigate} />
            <div className="my-2 border-t border-border/5" />
            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-4 mb-2">Moderation</p>
            <NavItem icon={ShieldCheck} label="Verification Queue" path="/admin/verifications" onNavigate={onNavigate} badge={pendingQueue?.length ?? null} />
            <NavItem icon={Settings} label="Global Settings" path="/admin/settings" onNavigate={onNavigate} />
          </>
        )}

        {/* OWNER */}
        {role === 'owner' && (
          <>
            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-4 mb-2">Business Ops</p>
            <NavItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" onNavigate={onNavigate} {...getBlockProps('/dashboard')} />
            <NavItem icon={Briefcase} label="Projects" path="/dashboard/projects" onNavigate={onNavigate} {...getBlockProps('/dashboard/projects')} />
            <NavItem icon={Wallet} label="Wallet" path="/dashboard/wallet" onNavigate={onNavigate} {...getBlockProps('/dashboard/wallet')} />
            <NavItem icon={Building2} label="Business Directory" path="/dashboard/inquiries" onNavigate={onNavigate} badge={summary?.msgCount} {...getBlockProps('/dashboard/inquiries')} />
            <NavItem icon={Store} label="Marketplace" path="/dashboard/marketplace" onNavigate={onNavigate} badge={summary?.orderCount} {...getBlockProps('/dashboard/marketplace')} />
            <NavItem icon={Radar} label="Tenders" path="/dashboard/opportunities" onNavigate={onNavigate} {...getBlockProps('/dashboard/opportunities')} />
            <NavItem icon={ClipboardList} label="Opportunities" path="/dashboard/tenders" onNavigate={onNavigate} badge={summary?.tenderCount} {...getBlockProps('/dashboard/tenders')} />
            <NavItem icon={MessageSquare} label="Community" path="/dashboard/community" onNavigate={onNavigate} {...getBlockProps('/dashboard/community')} />
            <NavItem icon={Landmark} label="Finance & Reports" path="/dashboard/finance" onNavigate={onNavigate} {...getBlockProps('/dashboard/finance')} />
            <NavItem icon={FileText} label="Invoices" path="/dashboard/invoices" onNavigate={onNavigate} {...getBlockProps('/dashboard/invoices')} />
            <NavItem icon={Receipt} label="Smart Receipts" path="/dashboard/receipts" onNavigate={onNavigate} {...getBlockProps('/dashboard/receipts')} />
            <NavItem icon={Calculator} label="BOQ Tools" path="/dashboard/boq" onNavigate={onNavigate} {...getBlockProps('/dashboard/boq')} />
            <NavItem icon={BarChart3} label="Analytics" path="/dashboard/analytics" onNavigate={onNavigate} {...getBlockProps('/dashboard/analytics')} />
            <NavItem icon={Sparkles} label="AI Hub" path="/dashboard/ai" onNavigate={onNavigate} {...getBlockProps('/dashboard/ai')} />

            <NavItem icon={Users} label="Workers Management" path="/dashboard/workers-management" onNavigate={onNavigate} {...getBlockProps('/dashboard/workers-management')} />
            <NavItem icon={Settings} label="User Profile" path="/dashboard/settings/profile" onNavigate={onNavigate} {...getBlockProps('/dashboard/settings/profile')} />
          </>
        )}

        {/* STAFF */}
        {role === 'staff' && (
          <>
            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-4 mb-2">Field Operations</p>
            <NavItem icon={HardHat} label="Site Portal" path="/staff/dashboard" onNavigate={onNavigate} />
            <NavItem icon={Briefcase} label="My Assignments" path="/staff/projects" onNavigate={onNavigate} />
            <NavItem icon={Sparkles} label="Engineering AI" path="/staff/ai" onNavigate={onNavigate} />
            <NavItem icon={Files} label="Site Documents" path="/staff/documents" onNavigate={onNavigate} />
            <NavItem icon={Settings} label="My Settings" path="/staff/settings" onNavigate={onNavigate} />
          </>
        )}

        <div className="mt-4 pt-4 border-t border-border/5">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-foreground/40 hover:text-rose-400 transition-all"
          >
            <LogOut size={18} />
            <span className="text-[13px] font-medium">Sign Out</span>
          </button>
        </div>
      </nav>


      {/* IDENTITY CARD */}
      <div className="mt-auto pt-4 space-y-3 shrink-0">
        {role === 'owner' && (
          <NavLink
            to="/dashboard/wallet"
            onClick={onNavigate}
            className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Wallet size={15} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Wallet</span>
            </div>
            <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
              {walletData
                ? `${Number(walletData.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${walletData.currency}`
                : '…'}
            </span>
          </NavLink>
        )}

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
          {role === 'staff' ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                <HardHat size={20} />
              </div>
              <div>
                <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-tighter">Site Engineer</p>
                <p className="text-xs font-bold text-foreground truncate w-28">{user?.name}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{role === 'admin' ? 'Admin' : 'Owner'}</p>
                <Crown size={14} className="text-primary" />
              </div>
              <p className="text-sm font-bold text-foreground truncate">{user?.name}</p>
              {role === 'owner' && (
                <div className={`mt-2 py-1.5 px-3 rounded-lg text-[10px] font-black text-center ${onboarded ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                  {onboarded ? 'Active' : 'Setup Required'}
                </div>
              )}
            </>
          )}
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
                  if (onNavigate) onNavigate();
                }}
                className="flex-1 py-4 bg-primary hover:bg-primary-dim text-brand-navy rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow transition-all"
              >
                Top Up Now
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
