import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { Users, UserPlus, ShieldCheck, Briefcase, Star, Loader2, Search, X, Inbox, HardHat, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../theme';

const WorkerCard = ({ worker }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="bg-card border border-border p-8 rounded-[3rem] shadow-sm hover:shadow-card hover:border-primary/20 transition-all flex flex-col items-center text-center relative overflow-hidden"
  >
    <div className="absolute top-6 right-6">
      <div className={`w-3 h-3 rounded-full border-2 border-border ${worker.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
    </div>
    <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden bg-muted ring-4 ring-brand-border flex items-center justify-center mb-6">
      {worker.image
        ? <img src={worker.image} alt={worker.name} className="w-full h-full object-cover" />
        : <span className="text-3xl font-black text-foreground/20 italic">{worker.name.charAt(0)}</span>
      }
    </div>
    <h3 className="text-xl font-black text-foreground mb-1">{worker.name}</h3>
    <p className={`${t.label} mb-6`}>{worker.role}</p>
    <div className="flex items-center gap-1.5 text-amber-400 mb-8 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
      <Star size={14} fill="currentColor" />
      <span className="text-[10px] font-black">{worker.rating || '5.0'} Verified</span>
    </div>
    <div className="flex flex-wrap justify-center gap-2 mb-10">
      {worker.skills?.map((skill: string) => (
        <span key={skill} className="px-3 py-1 bg-muted text-muted-foreground text-[9px] font-black uppercase rounded-lg border border-border tracking-wider">
          {skill}
        </span>
      ))}
    </div>
    <div className="w-full grid grid-cols-2 gap-3 mt-auto">
      <button className="py-4 bg-muted text-foreground/70 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-border hover:bg-primary hover:text-brand-navy transition-all">
        Profile
      </button>
      <button className="py-4 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest rounded-2xl border border-border hover:bg-card hover:text-primary transition-all">
        Message
      </button>
    </div>
  </motion.div>
);

const Workforce = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: 'Site Engineer', skills: '' });

  const { data: workers, isLoading } = useQuery({
    queryKey: ['workforce-list'],
    queryFn: async () => (await apiClient.get('/workforce')).data,
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/workforce', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce-list'] });
      setIsModalOpen(false);
      setNewMember({ name: '', role: 'Site Engineer', skills: '' });
    },
  });

  const filteredWorkers = workers?.filter((w: any) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        <header className={t.pageHeader}>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight italic">
              {user?.company ? `${user.company} Workforce` : 'Workforce & HR'}
            </h1>
            <p className={t.muted}>Manage site engineers, foremen, and team growth.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-card border border-border rounded-2xl px-4 py-2.5 w-64 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
              <Search size={18} className="text-foreground/35 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or role..."
                className="bg-transparent border-none outline-none text-xs ml-3 w-full font-medium text-foreground placeholder:text-foreground/30"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className={t.btnPrimary + ' flex items-center gap-2'}
            >
              <UserPlus size={18} /> Add Member
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-background p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex items-center justify-between">
            <div className="absolute top-0 right-0 opacity-10"><Users size={80} /></div>
            <div className="relative z-10">
              <p className={t.label + ' mb-1'}>Active Personnel</p>
              <h3 className="text-4xl font-black text-foreground italic">
                {isLoading ? '...' : workers?.filter((w: any) => w.status === 'Active').length}
              </h3>
            </div>
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-brand-navy shadow-lg relative z-10">
              <ShieldCheck size={24} />
            </div>
          </div>
          <div className="bg-card border border-border p-8 rounded-[3rem] shadow-sm flex items-center justify-between">
            <div>
              <p className={t.label + ' mb-1'}>Team Efficiency</p>
              <h3 className="text-4xl font-black text-foreground italic">
                {isLoading ? '...' : `${workers?.length > 0 ? Math.round((workers.filter((w: any) => w.status === 'Active').length / workers.length) * 100) : 0}%`}
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
              <Briefcase size={24} />
            </div>
          </div>
          <div className="bg-card border border-border p-8 rounded-[3rem] shadow-sm flex items-center justify-between">
            <div>
              <p className={t.label + ' mb-1'}>Total Members</p>
              <h3 className="text-4xl font-black text-foreground italic">{isLoading ? '...' : workers?.length || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
              <Users size={24} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={40} /></div>
        ) : filteredWorkers?.length === 0 ? (
          <div className={t.emptyState}>
            <Inbox className="mx-auto text-foreground/15 mb-4" size={64} />
            <h3 className="text-xl font-bold text-muted-foreground">No members found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence>
              {filteredWorkers?.map((worker: any) => <WorkerCard key={worker._id} worker={worker} />)}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {isModalOpen && (
            <div className={t.overlay}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0"
              />
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className={t.modal + ' relative z-10'}
              >
                <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-foreground/35 hover:text-rose-400 transition-colors">
                  <X size={24} />
                </button>
                <div className="mb-10 text-center">
                  <div className="w-16 h-16 bg-primary-pale rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                    <HardHat size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">Onboard Member</h2>
                  <p className={t.label + ' block mt-1'}>BuildHub Professional Registry</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={t.label + ' block mb-1 px-1'}>Full Name</label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                      className={t.input}
                      placeholder="e.g. Samuel Ndip"
                    />
                  </div>
                  <div>
                    <label className={t.label + ' block mb-1 px-1'}>Professional Role</label>
                    <select
                      value={newMember.role}
                      onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                      className={t.select}
                    >
                      <option>Site Engineer</option>
                      <option>Architect</option>
                      <option>Site Foreman</option>
                      <option>Quantity Surveyor</option>
                    </select>
                  </div>
                  <div>
                    <label className={t.label + ' block mb-1 px-1'}>Key Skills</label>
                    <input
                      type="text"
                      value={newMember.skills}
                      onChange={e => setNewMember({ ...newMember, skills: e.target.value })}
                      className={t.input}
                      placeholder="e.g. AutoCAD, Masonry, Safety"
                    />
                  </div>
                </div>
                <button
                  onClick={() => addMutation.mutate({ ...newMember, skills: newMember.skills.split(',').map(s => s.trim()) })}
                  disabled={addMutation.isPending || !newMember.name}
                  className={t.btnPrimary + ' w-full mt-10 py-5 flex items-center justify-center gap-3 disabled:opacity-50'}
                >
                  {addMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  Verify & Onboard
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
};

export default Workforce;
