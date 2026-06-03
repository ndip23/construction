import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import {
  User,
  MessageSquare,
  MapPin,
  Loader2,
  Inbox,
  Search,
  Phone,
  Clock3,
  ArrowUpRight,
  Filter,
  CheckCheck,
  BadgeAlert,
  XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { t, statusBadge } from '../theme';

type InquiryStatus = 'all' | 'new' | 'contacted' | 'closed';

const statusFilters: { key: InquiryStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'closed', label: 'Closed' },
];

const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, '');

const openWhatsApp = (phone: string) => {
  const clean = cleanPhone(phone);
  if (!clean) return;
  window.open(`https://wa.me/${clean}`, '_blank', 'noopener,noreferrer');
};

const formatInquiryTime = (value: string | Date) =>
  new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const DirectoryLeads = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<InquiryStatus>('all');

  const { data: leads, isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => (await apiClient.get('/inquiries')).data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'new' | 'contacted' | 'closed' }) =>
      apiClient.put(`/inquiries/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquiries'] }),
  });

  const inquiryList = Array.isArray(leads) ? leads : [];
  const todayKey = new Date().toDateString();

  const total = inquiryList.length;
  const newCount = inquiryList.filter((lead: any) => lead.status === 'new').length;
  const contactedCount = inquiryList.filter((lead: any) => lead.status === 'contacted').length;
  const todayCount = inquiryList.filter((lead: any) => new Date(lead.createdAt).toDateString() === todayKey).length;

  const filteredLeads = inquiryList.filter((lead: any) => {
    const matchesSearch = [lead.clientName, lead.clientPhone, lead.message]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter = activeFilter === 'all' || lead.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        <header className="mb-8 space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div>
              <p className={t.label}>Client inbox</p>
              <h1 className={t.h1 + ' text-3xl md:text-4xl'}>Inquiries</h1>
              <p className={t.muted + ' mt-2'}>Messages saved from public company profiles and directory clicks.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
              {[
                { label: 'Total', value: total, icon: Inbox },
                { label: 'New', value: newCount, icon: BadgeAlert },
                { label: 'Contacted', value: contactedCount, icon: CheckCheck },
                { label: 'Today', value: todayCount, icon: Clock3 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className={t.statCard + ' min-w-[8rem]'}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={t.label + ' mb-1'}>{label}</p>
                      <p className="text-2xl font-black text-white">{value}</p>
                    </div>
                    <div className={t.iconBoxNavy}>
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-navy-card border border-brand-border rounded-[2rem] p-4 md:p-5 flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="flex items-center gap-3 flex-1 bg-brand-navy-light border border-brand-border rounded-2xl px-4 py-3">
              <Search className="text-white/45 shrink-0" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, or message"
                className="bg-transparent outline-none text-sm font-medium text-white placeholder:text-white/35 w-full min-w-0"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={16} className="text-white/35 shrink-0 ml-1" />
              {statusFilters.map((item) => {
                const active = activeFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveFilter(item.key)}
                    className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      active
                        ? 'bg-brand-yellow text-brand-navy border-brand-yellow shadow-yellow'
                        : 'bg-brand-navy text-white/55 border-brand-border hover:text-white hover:border-brand-yellow/20'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {isLoading ? (
<div className="h-64 flex items-center justify-center text-foreground/35 font-bold animate-pulse">
            <Loader2 className="animate-spin mr-2" /> Syncing with Directory...
          </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className={t.emptyState}>
<Inbox className="mx-auto text-foreground/15 mb-4" size={48} />
            <h3 className="text-xl font-bold text-muted-foreground">
              {total === 0 ? 'No inquiries yet' : 'No inquiries match your filters'}
            </h3>
            <p className={t.label + ' mt-1 italic'}>
              {total === 0 ? 'New leads will appear here once clients reach out.' : 'Try a different name, phone number, or status.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLeads.map((lead: any) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={lead._id}
                className="bg-card border border-border p-6 rounded-[2.5rem] shadow-sm hover:shadow-card hover:border-primary/20 transition-all flex flex-col md:flex-row items-center justify-between group gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-brand-navy font-black text-xl shadow-sm shrink-0">
                    {lead.clientName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground">{lead.projectInterest || 'General Inquiry'}</h3>
                    <div className="flex items-center gap-4 mt-1 text-muted-foreground text-xs font-bold uppercase tracking-tight">
                      <span className="flex items-center gap-1"><User size={14} className="text-primary" /> {lead.clientName}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} className="text-primary" /> {lead.location || 'BuildHub Network'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4 md:mt-0">
                  <div className="text-right hidden md:block">
                    <p className={t.label + ' mb-0.5'}>Received</p>
                    <p className="text-xs font-bold text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</p>
                  </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-white group-hover:text-brand-yellow transition-colors">
                            {lead.clientName || 'Unnamed Lead'}
                          </h3>
                          <span className={statusBadge(lead.status) + ' px-3 py-1'}>
                            {lead.status || 'new'}
                          </span>
                        </div>

<div className="flex flex-col sm:flex-row xl:flex-col items-stretch sm:items-end gap-3 shrink-0">
                    <div className="text-right hidden md:block">
                      <p className={t.label + ' mb-0.5'}>Received</p>
                      <p className="text-xs font-bold text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openWhatsApp(lead.clientPhone)}
                        className="p-4 bg-muted border border-border rounded-2xl text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-all"
                      >
                        <MessageSquare size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default DirectoryLeads;
