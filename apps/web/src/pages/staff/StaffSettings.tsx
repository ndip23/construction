import { DashboardShell } from '../../components/layout/DashboardShell';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  User, 
  Lock, 
  Bell, 
  ShieldCheck, 
  ChevronRight, 
  Camera, 
  LogOut,
  Fingerprint
} from 'lucide-react';
import { motion } from 'framer-motion';

const SettingItem = ({ icon: Icon, title, desc }: any) => (
  <motion.div 
    whileHover={{ x: 5 }}
    className="bg-card border border-border p-6 rounded-[2.5rem] border border-border flex items-center justify-between hover:bg-muted cursor-pointer transition-all group shadow-sm"
  >
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary-pale transition-all">
        <Icon size={22} />
      </div>
      <div>
        <h4 className="text-sm font-black text-foreground tracking-tight">{title}</h4>
        <p className="text-[11px] text-muted-foreground font-medium">{desc}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-foreground/15 group-hover:text-primary transition-colors" />
  </motion.div>
);

const StaffSettings = () => {
  const { user, logout } = useAuthStore();

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto pb-20">
        
        {/* DYNAMIC STAFF HEADER */}
        <header className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 rounded-[3rem] bg-muted border-4 border-border shadow-2xl overflow-hidden flex items-center justify-center"
            >
               {user?.avatar ? (
                 <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
               ) : (
                 <span className="text-4xl font-black text-foreground italic opacity-20">{user?.name?.charAt(0)}</span>
               )}
            </motion.div>
            <button className="absolute bottom-0 right-0 bg-primary text-brand-navy p-3 rounded-2xl shadow-xl border-4 border-border hover:bg-primary-dim hover:scale-110 transition-all">
               <Camera size={18} />
            </button>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">{user?.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                {user?.role === 'staff' ? 'Field Engineer' : 'Team Member'}
             </span>
             <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary-pale px-3 py-1 rounded-full border border-primary">
                ID: #BH-{user?.id?.slice(-4) || '9920'}
             </span>
          </div>
        </header>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-foreground/35 uppercase tracking-[0.3em] px-4 mb-2">Account Configuration</h3>
          
          <SettingItem 
            icon={User} 
            title="Field Identity" 
            desc={`Verified name: ${user?.name}`} 
          />
          
          <SettingItem 
            icon={Lock} 
            title="Access & Security" 
            desc="Manage your encrypted login and biometric keys" 
          />
          
          <SettingItem 
            icon={Bell} 
            title="Site Notifications" 
            desc="Real-time alerts for project tasks and MD instructions" 
          />
          
          <SettingItem 
            icon={ShieldCheck} 
            title="Technical Certifications" 
            desc="Review your active engineering and safety credentials" 
          />

          <SettingItem 
            icon={Fingerprint} 
            title="Privacy Guard" 
            desc="Control how your site location data is managed" 
          />
        </div>

        {/* LOGOUT ACTION */}
        <div className="mt-12 px-2">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-between p-6 bg-rose-50/50 rounded-[2.5rem] border border-rose-100 hover:bg-rose-100 transition-all group"
          >
            <div className="flex items-center gap-4 text-rose-400">
               <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
               <span className="font-black text-sm uppercase tracking-widest">Terminate Session</span>
            </div>
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Logout</p>
          </button>
        </div>

        {/* COMPLIANCE FOOTER */}
        <div className="mt-20 pt-8 border-t border-border text-center opacity-40">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Cpromark Staff Security Protocol • v4.2.1</p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default StaffSettings;