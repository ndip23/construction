import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { ArrowLeft, Send, ShieldCheck } from 'lucide-react';

const TenderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: tender, isLoading } = useQuery({
    queryKey: ['tender', id],
    queryFn: async () => (await apiClient.get(`/tenders/${id}`)).data,
    enabled: !!id
  });

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading project details...</div>;

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto pb-20">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-widest mb-10 hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Board
        </button>

        <div className="bg-card rounded-[3.5rem] shadow-premium border border-border overflow-hidden">
          {/* HEADER */}
          <div className="p-12 bg-muted border-b border-border">
             <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary text-brand-navy px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                   {tender?.category || "General Construction"}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">Project ID: #{tender?._id.slice(-6)}</span>
             </div>
             <h1 className="text-4xl font-black text-foreground tracking-tight mb-8 leading-tight">{tender?.title}</h1>
             
             <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black text-muted-foreground uppercase">Budget</span>
                   <span className="font-black text-foreground text-xl">${tender?.budget?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black text-muted-foreground uppercase">Location</span>
                   <span className="font-black text-foreground text-xl">{tender?.location}</span>
                </div>
                <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black text-muted-foreground uppercase">Ends</span>
                   <span className="font-black text-primary text-xl">{new Date(tender?.deadline).toLocaleDateString()}</span>
                </div>
             </div>
          </div>

          {/* CONTENT */}
          <div className="p-12 space-y-10">
             <div>
                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Project Description</h3>
                <p className="text-foreground/70 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                  {tender?.description}
                </p>
             </div>

             <div className="bg-background p-8 rounded-[2.5rem] border border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-primary shadow-sm">
                      <ShieldCheck />
                   </div>
                   <div>
                      <p className="text-sm font-black text-foreground">Verified Opportunity</p>
                      <p className="text-xs text-muted-foreground font-medium">This project has been vetted by Cpromark admin.</p>
                   </div>
                </div>
                <Link 
                  to={`/dashboard/tenders/${tender?.slug}/bid`}
                  className="bg-background text-foreground px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-primary transition-all flex items-center gap-3"
                >
                   Submit Proposal <Send size={16} />
                </Link>
             </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default TenderDetail;