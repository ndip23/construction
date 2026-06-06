import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../../components/layout/DashboardShell';
import apiClient from '../../api/client';
import { 
  Building2, 
  Check, 
  X, 
  FileText, 
  Globe, 
  MapPin, 
  Loader2, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminVerifications = () => {
  const queryClient = useQueryClient();

  // 1. FETCH REAL PENDING COMPANIES
  const { data: queue, isLoading } = useQuery({
    queryKey: ['verification-queue'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/pending');
      return data;
    }
  });

  // 2. VERIFICATION MUTATION (Approve or Reject)
  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      apiClient.put(`/admin/verify/${id}`, { status }),
    onSuccess: () => {
      // Refresh the queue immediately after action
      queryClient.invalidateQueries({ queryKey: ['verification-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-global-stats'] });
    }
  });

  return (
    <DashboardShell>
      <div className="max-w-[1400px] mx-auto pb-20">
        
        {/* HEADER */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight italic">Verification Queue</h1>
            <p className="text-sm text-muted-foreground font-medium">Verify business legitimacy and technical credentials before network activation.</p>
          </div>
          {!isLoading && queue?.length > 0 && (
            <div className="bg-primary text-brand-navy px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-yellow flex items-center gap-2">
               <AlertCircle size={14} /> {queue.length} Applications Pending
            </div>
          )}
        </header>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Loader2 className="animate-spin text-primary mb-4" size={40} />
            <p className="font-black text-muted-foreground uppercase tracking-widest text-[10px]">Accessing Secure Queue...</p>
          </div>
        ) : queue?.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-card border border-border p-24 rounded-[4rem] border-2 border-dashed border-border text-center">
             <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-6">
                <ShieldCheck size={40} />
             </div>
             <h3 className="text-2xl font-black text-foreground">Queue is Clear</h3>
             <p className="text-sm text-muted-foreground mt-1 font-medium">All registered companies have been processed.</p>
          </div>
        ) : (
          /* QUEUE LIST (REAL DATA) */
          <div className="space-y-6">
            <AnimatePresence>
              {queue?.map((company: any, i: number) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  key={company._id} 
                  className="bg-card border border-border p-8 rounded-[3rem] border border-border shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 group hover:border-primary/20 hover:shadow-card transition-all relative overflow-hidden"
                >
                  <div className="flex items-center gap-8 flex-1">
                    {/* DYNAMIC LOGO / ICON */}
                    <div className="w-24 h-24 bg-background rounded-[2.5rem] flex items-center justify-center text-foreground font-black text-3xl italic shrink-0 shadow-2xl transition-transform group-hover:scale-105">
                       {company.logo ? (
                         <img src={company.logo} className="w-full h-full object-cover rounded-[2.5rem]" alt="" />
                       ) : company.name.charAt(0)}
                    </div>

                    <div className="flex-1">
                       <h3 className="text-2xl font-black text-foreground mb-2">{company.name}</h3>
                       <div className="flex flex-wrap items-center gap-5 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {company.city}, {company.country}</span>
                          <span className="flex items-center gap-1.5"><Globe size={14} className="text-primary" /> {company.website || 'No Web ID'}</span>
                       </div>
                       
                       <div className="mt-6 flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-primary-pale text-primary rounded-lg text-[9px] font-black uppercase border border-primary">
                             Applied {new Date(company.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                            company.documentsUploaded ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-400 border-rose-100'
                          }`}>
                             {company.documentsUploaded ? 'Docs Verified' : 'Missing KYC Docs'}
                          </span>
                       </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-3 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-10">
                     <button className="flex-1 lg:flex-none px-6 py-4 bg-muted text-brand-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-2">
                        <FileText size={16} /> Review Dossier
                     </button>
                     
                     <button 
                        onClick={() => verifyMutation.mutate({ id: company._id, status: 'rejected' })}
                        disabled={verifyMutation.isPending}
                        className="p-5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-foreground transition-all shadow-sm flex items-center justify-center"
                     >
                        <X size={20} />
                     </button>
                     
                     <button 
                        onClick={() => verifyMutation.mutate({ id: company._id, status: 'verified' })}
                        disabled={verifyMutation.isPending}
                        className="p-5 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-foreground transition-all shadow-xl shadow-emerald-900/10 flex items-center justify-center"
                     >
                        {verifyMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                     </button>
                  </div>

                  {/* BACKGROUND DECORATION */}
                  <div className="absolute top-[-10px] left-[-10px] opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                    <Building2 size={160} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* COMPLIANCE FOOTER */}
        <div className="mt-20 pt-8 border-t border-border flex justify-between items-center opacity-40 px-6">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">Cpromark Platform Governance • Ruler Access Level</p>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em]">Node: AFR-VERIFY-01</p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default AdminVerifications;