import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import {
  LayoutDashboard, Building2, Briefcase, Store,
  ClipboardList, FileText, Calculator, Landmark,
  Users, Sparkles, Files, Settings, Crown, HardHat, ShieldCheck, BarChart3, LogOut,
  Inbox, Wrench, Lock, Wallet, Radar, Receipt, MessageSquare
} from 'lucide-react';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number | null;
  onNavigate?: () => void;
  locked?: boolean;
}

const NavItem = ({ icon: Icon, label, path, badge, onNavigate, locked }: NavItemProps) => {
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
      onClick={onNavigate}
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
  const { getStep } = useOnboardingStore();
  const role = user?.role;

  const onboardingStep = user?.id ? getStep(user.id) : 'done';
  const onboarded = onboardingStep === 'done';
  const navLocked = !onboarded;

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
    enabled: role === 'owner' && onboarded,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => (await apiClient.get('/wallet/balance')).data,
    enabled: role === 'owner',
    refetchInterval: 60000,
  });

  return (
    <aside className="w-[min(280px,85vw)] sm:w-[260px] h-[100dvh] bg-background text-foreground flex flex-col p-4 overflow-y-auto no-scrollbar border-r border-border/5">
      {/* LOGO */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-black text-brand-navy text-xs italic">BH</div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">BuildHub</h2>
      </div>

      {/* Setup banner is hidden when navLocked is false */}
      {navLocked && (
        <div className="mb-4 mx-1 px-4 py-3 bg-primary/10 border border-primary/20 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Setup in progress</p>
          <p className="text-[11px] text-muted-foreground font-medium">
            {onboardingStep === 'wallet' && 'Top up wallet to continue →'}
            {onboardingStep === 'profile' && 'Complete business profile →'}
            {onboardingStep === 'service' && 'Add your first service →'}
            {onboardingStep === 'product' && 'Upload a product →'}
            {onboardingStep === 'tour' && 'Taking the tour →'}
          </p>
        </div>
      )}

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

        {/* OWNER */}
        {role === 'owner' && (
          <>
            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-4 mb-2">Business Ops</p>
            <NavItem icon={LayoutDashboard} label="Dashboard" path="/dashboard" onNavigate={onNavigate} />
            <NavItem icon={Briefcase} label="Projects" path="/dashboard/projects" onNavigate={onNavigate} />
            <NavItem icon={Wallet} label="Wallet" path="/dashboard/wallet" onNavigate={onNavigate} />
            <NavItem icon={Building2} label="Business Profile" path="/dashboard/settings/business" onNavigate={onNavigate} locked={navLocked} />
            <NavItem icon={Wrench} label="My Services" path="/dashboard/services" onNavigate={onNavigate} locked={navLocked} />
            <NavItem icon={Inbox} label="Inquiries" path="/dashboard/inquiries" onNavigate={onNavigate} badge={summary?.msgCount} locked={navLocked} />
            <NavItem icon={Store} label="Marketplace" path="/dashboard/marketplace" onNavigate={onNavigate} badge={summary?.orderCount} locked={navLocked} />
            <NavItem icon={ClipboardList} label="Tenders & Jobs" path="/dashboard/tenders" onNavigate={onNavigate} badge={summary?.tenderCount} locked={navLocked} />
            <NavItem icon={Radar} label="Tenders" path="/dashboard/opportunities" onNavigate={onNavigate} />
            <NavItem icon={Landmark} label="Finance & Reports" path="/dashboard/finance" onNavigate={onNavigate} locked={navLocked} />
            <NavItem icon={FileText} label="Invoices" path="/dashboard/invoices" onNavigate={onNavigate} locked={navLocked} />
            <NavItem icon={Receipt} label="Smart Receipts" path="/dashboard/receipts" onNavigate={onNavigate} locked={navLocked} />
            <NavItem icon={Users} label="Workers & Team" path="/dashboard/workforce" onNavigate={onNavigate} locked={navLocked} />
            <NavItem icon={Calculator} label="BOQ Tools" path="/dashboard/boq" onNavigate={onNavigate} locked={navLocked} />
            <NavItem icon={BarChart3} label="Analytics" path="/dashboard/analytics" onNavigate={onNavigate} />
            <NavItem icon={Sparkles} label="AI Hub" path="/dashboard/ai" onNavigate={onNavigate} />
            <NavItem icon={MessageSquare} label="Community Forum" path="/dashboard/community" onNavigate={onNavigate} />
            <NavItem icon={Settings} label="User Profile" path="/dashboard/settings/profile" onNavigate={onNavigate} />
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
            <NavItem icon={MessageSquare} label="Community Forum" path="/dashboard/community" onNavigate={onNavigate} />
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
                <div className={`mt-2 py-1.5 px-3 rounded-lg text-[10px] font-black text-center ${onboarded ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-400'}`}>
                  {onboarded ? 'Active' : 'Setup required'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
