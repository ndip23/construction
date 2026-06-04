import { useState } from 'react';
<<<<<<< HEAD
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import {
  User,
  MessageSquare,
  MapPin,
  Loader2,
  Inbox,
  Search,
  Clock3,
  Filter,
  CheckCheck,
  BadgeAlert,
} from 'lucide-react';
import { motion } from 'framer-motion';
=======
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { User, MapPin, Loader2, Inbox, Eye, MousePointerClick, TrendingUp, Sparkles, ChevronDown, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
>>>>>>> 7d1c33eea5ac569aa87505e32ff265b2b6d88d3c
import { t, statusBadge } from '../theme';

const DirectoryLeads = () => {
<<<<<<< HEAD
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<InquiryStatus>('all');
=======
  const queryClient = useQueryClient();
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
>>>>>>> 7d1c33eea5ac569aa87505e32ff265b2b6d88d3c

  const { data: leads, isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => (await apiClient.get('/inquiries')).data,
  });

<<<<<<< HEAD
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
=======
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['inquiries', 'stats'],
    queryFn: async () => (await apiClient.get('/inquiries/stats')).data,
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['inquiries', 'ai-insights'],
    queryFn: async () => (await apiClient.get('/inquiries/ai-insights')).data,
    enabled: true, // Run automatically
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/inquiries/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquiries'] }),
>>>>>>> 7d1c33eea5ac569aa87505e32ff265b2b6d88d3c
  });

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
<<<<<<< HEAD
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
=======
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className={t.h1 + ' text-3xl'}>Inquiries & Activity</h1>
            <p className={t.muted + ' italic mt-1'}>Client inquiries and public directory performance.</p>
>>>>>>> 7d1c33eea5ac569aa87505e32ff265b2b6d88d3c
          </div>
        </header>

        {insightsLoading && (
          <div className="mb-10 bg-card border border-border p-8 rounded-[2.5rem] flex items-center justify-center shadow-sm">
            <div className="flex items-center gap-3 text-primary font-bold animate-pulse">
              <Loader2 size={24} className="animate-spin" /> Analyzing your business metrics with AI...
            </div>
          </div>
        )}

        {insights && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 bg-card border border-border rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-black text-foreground text-lg">AI Performance Analysis</h3>
                <p className="text-xs text-muted-foreground font-medium">Auto-generated strategic insights based on your recent directory traffic.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-8 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{insights.ctaPerformance?.title}</h4>
                </div>
                <p className="text-foreground font-medium leading-relaxed text-sm">{insights.ctaPerformance?.insight}</p>
              </div>

              <div className="p-8 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={16} className="text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{insights.serviceOpportunities?.title}</h4>
                </div>
                <p className="text-foreground font-medium leading-relaxed text-sm">{insights.serviceOpportunities?.insight}</p>
              </div>

              <div className="p-8 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{insights.quickAdvice?.title}</h4>
                </div>
                <p className="text-foreground font-medium leading-relaxed text-sm">{insights.quickAdvice?.insight}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* STATS GRID */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-card border border-border p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
              <div>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-1">Total Impressions</p>
                <h3 className="text-4xl font-black text-foreground">{stats.impressions}</h3>
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Eye size={24} />
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
              <div>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-1">WhatsApp Clicks</p>
                <h3 className="text-4xl font-black text-foreground">{stats.clicks}</h3>
              </div>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                <MousePointerClick size={24} />
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
              <div>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-1">CTA Conversion</p>
                <h3 className="text-4xl font-black text-foreground">{stats.ctaRate}%</h3>
              </div>
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        )}

        <h2 className={t.h2 + ' mb-6 text-2xl'}>Recent Messages</h2>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-foreground/35 font-bold animate-pulse">
            <Loader2 className="animate-spin mr-2" /> Syncing with Directory...
          </div>
        ) : leads?.length === 0 ? (
          <div className={t.emptyState}>
            <Inbox className="mx-auto text-foreground/15 mb-4" size={48} />
            <h3 className="text-xl font-bold text-muted-foreground">No inquiries yet</h3>
            <p className={t.label + ' mt-1 italic'}>Update your profile to attract more clients</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {leads?.map((lead: any) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={lead._id}
                className="bg-card border border-border rounded-[2.5rem] shadow-sm hover:border-primary/20 transition-all overflow-hidden"
              >
                <div className="p-6 flex flex-col md:flex-row items-center justify-between cursor-pointer" onClick={() => setExpandedLead(expandedLead === lead._id ? null : lead._id)}>
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-brand-navy font-black text-xl shadow-sm shrink-0">
                      {lead.clientName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground truncate max-w-[200px] md:max-w-md">{lead.message ? lead.message.substring(0, 50) + '...' : 'Direct Inquiry'}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><User size={12} className="text-primary" /> {lead.clientName}</span>
                        {lead.location && <span className="flex items-center gap-1"><MapPin size={12} className="text-primary" /> {lead.location}</span>}
                      </div>
                    </div>
                  </div>

<<<<<<< HEAD
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                  <span className={statusBadge(lead.status) + ' px-3 py-1'}>
                    {lead.status || 'new'}
                  </span>
                  <div className="text-right hidden md:block">
                    <p className={t.label + ' mb-0.5'}>Received</p>
                    <p className="text-xs font-bold text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(lead.clientPhone)}
                    className="p-4 bg-muted border border-border rounded-2xl text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-all"
                  >
                    <MessageSquare size={20} />
                  </button>
=======
                  <div className="flex items-center justify-between w-full md:w-auto gap-6 mt-4 md:mt-0">
                    <div className="text-right hidden lg:block">
                      <p className={t.label + ' mb-0.5'}>Received</p>
                      <p className="text-xs font-bold text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); statusMutation.mutate({ id: lead._id, status: lead.status === 'New' ? 'Contacted' : lead.status === 'Contacted' ? 'Closed' : 'New' }); }}
                      className={statusBadge(lead.status) + ' px-5 py-2 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap'}
                    >
                      {lead.status}
                    </button>

                    <button className="p-3 bg-muted border border-border rounded-xl text-muted-foreground hover:bg-background hover:text-foreground transition-all shrink-0">
                      <ChevronDown size={20} className={`transition-transform ${expandedLead === lead._id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
>>>>>>> 7d1c33eea5ac569aa87505e32ff265b2b6d88d3c
                </div>

                <AnimatePresence>
                  {expandedLead === lead._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border bg-muted/30"
                    >
                      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-primary">Message</h4>
                          <p className="text-sm font-medium text-foreground/80 leading-relaxed whitespace-pre-wrap bg-background p-6 rounded-3xl border border-border">
                            {lead.message || lead.projectInterest}
                          </p>
                        </div>
                        <div className="space-y-6">
                          <h4 className="text-xs font-black uppercase tracking-widest text-primary">Contact Details</h4>
                          <div className="space-y-4 bg-background p-6 rounded-3xl border border-border">
                            <div className="flex items-center gap-3">
                              <Mail size={16} className="text-muted-foreground" />
                              <span className="text-sm font-bold truncate">{lead.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone size={16} className="text-muted-foreground" />
                              <span className="text-sm font-bold">{lead.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <User size={16} className="text-muted-foreground" />
                              <span className="text-sm font-bold">{lead.clientName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default DirectoryLeads;
