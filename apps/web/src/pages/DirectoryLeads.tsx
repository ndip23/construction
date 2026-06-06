import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { User, MapPin, Loader2, Inbox, Eye, MousePointerClick, TrendingUp, Sparkles, ChevronDown, Mail, Phone, Store, Briefcase, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { t, statusBadge } from '../theme';

const DashboardCard = ({ icon: Icon, title, desc, path, delay, isPrimary, className }: any) => (
  <Link to={path} className={`group block relative overflow-hidden rounded-[2rem] border transition-all duration-300 hover:-translate-y-1 ${
    isPrimary
      ? 'bg-foreground text-background border-foreground shadow-xl'
      : 'bg-card text-foreground border-border shadow-sm hover:shadow-lg'
  } ${className || ''}`}>
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
      <div>
        <h3 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 tracking-tight">{title}</h3>
        <p className={`text-[11px] sm:text-[13px] font-medium leading-relaxed ${
          isPrimary ? 'text-background/80' : 'text-muted-foreground'
        }`}>{desc}</p>
      </div>
    </motion.div>
    {isPrimary && (
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl -mr-10 -mt-10" />
    )}
  </Link>
);

const DirectoryLeads = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const { data: leads, isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => (await apiClient.get('/inquiries')).data,
  });

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
  });

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => (await apiClient.get('/auth/company/profile')).data,
  });

  useEffect(() => {
    if (!companyLoading && company) {
      const isComplete = !!(company.phone || company.address || company.city);
      if (!isComplete && !showCompletionModal) {
        setShowCompletionModal(true);
      }
    }
  }, [company, companyLoading, showCompletionModal]);

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20 relative">
        {/* COMPLETION MODAL */}
        <AnimatePresence>
          {showCompletionModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/90 backdrop-blur-md" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-card border border-border rounded-[3rem] p-10 max-w-lg w-full text-center shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-amber-400" />
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">Profile Incomplete</h2>
                <p className="text-muted-foreground font-medium mb-8 text-sm leading-relaxed">
                  Before you can access the directory features and get discovered by clients, you need to complete your business profile.
                </p>
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    navigate('/dashboard/settings/business');
                  }}
                  className="w-full bg-primary text-brand-navy py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all"
                >
                  Complete Profile Now
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className={t.h1 + ' text-3xl'}>Business Directory</h1>
            <p className={t.muted + ' italic mt-1'}>Client inquiries and public directory performance.</p>
          </div>
        </header>

        {/* QUICK LINKS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-12">
          <DashboardCard
            icon={Store}
            title="Manage Services"
            desc="Control the services your company offers."
            path="/dashboard/services"
            delay={0.05}
            isPrimary={true}
          />
          <DashboardCard
            icon={Briefcase}
            title="Project Showcase"
            desc="Add visual evidence of your completed works."
            path="/dashboard/showcase"
            delay={0.1}
          />
          <DashboardCard
            icon={Building2}
            title="Edit Business Profile"
            desc="Update your company's core directory details."
            path="/dashboard/settings/business"
            delay={0.15}
          />
        </div>

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
