import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  Users, UserPlus, ShieldCheck, Smartphone, Loader2, Search, X,
  Inbox, HardHat, CheckCircle2, Pencil, KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { t, statusBadge } from '../theme';

interface Worker {
  _id: string;
  name: string;
  role: string;
  status: string;
  phone?: string;
  email?: string;
  payType?: 'hourly' | 'daily' | 'monthly';
  payRate?: number;
  portalEnabled?: boolean;
}

const ROLES = ['Site Engineer', 'Site Foreman', 'Architect', 'Quantity Surveyor', 'Welder', 'Mason', 'Electrician', 'Labourer'];

const emptyForm = {
  name: '', role: 'Labourer', phone: '', email: '',
  payType: 'daily' as 'hourly' | 'daily' | 'monthly', payRate: 0,
  portalEnabled: false, pin: '',
};

const Workforce = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { fromUSD, format } = useCurrencyStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: workers, isLoading } = useQuery<Worker[]>({
    queryKey: ['workforce-list'],
    queryFn: async () => (await apiClient.get('/workforce')).data,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      editingId
        ? apiClient.put(`/workforce/${editingId}`, payload)
        : apiClient.post('/workforce', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce-list'] });
      closeModal();
    },
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditingId(w._id);
    setForm({
      name: w.name, role: w.role, phone: w.phone || '', email: w.email || '',
      payType: w.payType || 'daily', payRate: w.payRate || 0,
      portalEnabled: !!w.portalEnabled, pin: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const submit = () => {
    const payload: any = {
      name: form.name, role: form.role, phone: form.phone, email: form.email,
      payType: form.payType, payRate: Number(form.payRate) || 0,
      portalEnabled: form.portalEnabled,
    };
    if (form.portalEnabled && form.pin) payload.pin = form.pin;
    saveMutation.mutate(payload);
  };

  const list = workers || [];
  const filtered = list.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = list.filter((w) => w.status === 'Active').length;
  const portalCount = list.filter((w) => w.portalEnabled).length;

  const KPIS = [
    { label: 'Total Workers', value: list.length, icon: <Users size={22} />, box: t.iconBoxNavy },
    { label: 'Active', value: activeCount, icon: <ShieldCheck size={22} />, box: t.iconBoxGreen },
    { label: 'Portal Enabled', value: portalCount, icon: <Smartphone size={22} />, box: t.iconBoxYellow },
  ];

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        <header className={t.pageHeader}>
          <div>
            <h1 className={`${t.h2} italic`}>
              {user?.company ? `${user.company} Workforce` : 'Workforce'}
            </h1>
            <p className={t.muted}>Manage your crew, pay rates, and site-portal access.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-card border border-border rounded-2xl px-4 py-2.5 w-64 focus-within:ring-2 focus-within:ring-primary/40 transition-all">
              <Search size={18} className="text-foreground/35 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or role..."
                className="bg-transparent border-none outline-none text-xs ml-3 w-full font-medium text-foreground placeholder:text-foreground/30"
              />
            </div>
            <button onClick={openAdd} className={t.btnPrimary + ' flex items-center gap-2'}>
              <UserPlus size={18} /> Add Worker
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {KPIS.map((k) => (
            <div key={k.label} className={`${t.statCard} flex items-center justify-between`}>
              <div>
                <p className={t.label + ' mb-1'}>{k.label}</p>
                <h3 className="text-4xl font-black text-foreground italic">{isLoading ? '...' : k.value}</h3>
              </div>
              <div className={k.box}>{k.icon}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={40} /></div>
        ) : filtered.length === 0 ? (
          <div className={t.emptyState}>
            <Inbox className="mx-auto text-foreground/15 mb-4" size={64} />
            <h3 className="text-xl font-bold text-muted-foreground">No workers found</h3>
          </div>
        ) : (
          <div className={`${t.cardLg} overflow-hidden`}>
            <table className="w-full">
              <thead>
                <tr className={t.tableHead}>
                  <th className="px-6 py-4 text-left">Worker</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Pay</th>
                  <th className="px-6 py-4 text-left">Portal</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((w) => (
                    <motion.tr
                      key={w._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={t.tableRow}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground/30 font-black italic shrink-0">
                            {w.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground">{w.name}</p>
                            <p className={t.micro + ' text-muted-foreground'}>{w.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={statusBadge(w.status)}>{w.status}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-black text-foreground">{money(w.payRate || 0)}</span>
                        <span className={t.micro + ' text-muted-foreground'}> /{w.payType || 'daily'}</span>
                      </td>
                      <td className="px-6 py-5">
                        {w.portalEnabled ? (
                          <span className={`${t.badgeGreen} inline-flex items-center gap-1`}>
                            <Smartphone size={10} /> Enabled
                          </span>
                        ) : (
                          <span className={t.badgeNavy}>Off</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => openEdit(w)}
                          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        <AnimatePresence>
          {isModalOpen && (
            <div className={t.overlay}>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={closeModal} className="absolute inset-0"
              />
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className={t.modal + ' relative z-10 max-h-[90vh] overflow-y-auto'}
              >
                <button onClick={closeModal} className="absolute top-8 right-8 text-foreground/35 hover:text-rose-400 transition-colors">
                  <X size={24} />
                </button>
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-primary-pale rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
                    <HardHat size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">
                    {editingId ? 'Edit Worker' : 'Add Worker'}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={t.label + ' block mb-1 px-1'}>Full Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={t.input} placeholder="e.g. Samuel Ndip" />
                  </div>
                  <div>
                    <label className={t.label + ' block mb-1 px-1'}>Role</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={t.select}>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={t.label + ' block mb-1 px-1'}>Phone</label>
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={t.input} placeholder="+234..." />
                    </div>
                    <div>
                      <label className={t.label + ' block mb-1 px-1'}>Email</label>
                      <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={t.input} placeholder="name@site.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={t.label + ' block mb-1 px-1'}>Pay Type</label>
                      <select value={form.payType} onChange={(e) => setForm({ ...form, payType: e.target.value as any })} className={t.select}>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className={t.label + ' block mb-1 px-1'}>Pay Rate</label>
                      <input type="number" value={form.payRate} onChange={(e) => setForm({ ...form, payRate: Number(e.target.value) })} className={t.input} placeholder="0" />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 px-1 py-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.portalEnabled}
                      onChange={(e) => setForm({ ...form, portalEnabled: e.target.checked })}
                      className="w-5 h-5 rounded accent-primary"
                    />
                    <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                      <Smartphone size={15} className="text-primary" /> Enable site portal
                    </span>
                  </label>

                  {form.portalEnabled && (
                    <div>
                      <label className={t.label + ' block mb-1 px-1 flex items-center gap-1'}>
                        <KeyRound size={11} /> Portal PIN {editingId && <span className="text-muted-foreground/60">(leave blank to keep)</span>}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.pin}
                        onChange={(e) => setForm({ ...form, pin: e.target.value })}
                        className={t.input}
                        placeholder="e.g. 4821"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={submit}
                  disabled={saveMutation.isPending || !form.name}
                  className={t.btnPrimary + ' w-full mt-8 py-5 flex items-center justify-center gap-3 disabled:opacity-50'}
                >
                  {saveMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {editingId ? 'Save Changes' : 'Add Worker'}
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
