import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import apiClient from '../api/client';
import { 
  CheckCircle2, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Calendar, 
  Share2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

const ServiceDetail = () => {
  const { id } = useParams(); // Get Service ID from URL
  const navigate = useNavigate();

  // 1. FETCH REAL SERVICE DATA
  const { data: service, isLoading, isError } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/explore/services/${id}`);
      return data;
    },
    enabled: !!id
  });

  // 2. LOADING STATE (Apple-style)
  if (isLoading) return (
    <div className="min-h-screen bg-card flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-primary mb-4 mx-auto" size={40} />
        <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Loading Service Details...</p>
      </div>
    </div>
  );

  // 3. ERROR STATE
  if (isError || !service) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
       <AlertCircle className="text-rose-500 mb-4" size={48} />
       <h2 className="text-3xl font-black text-foreground">Service Not Found</h2>
       <p className="text-brand-muted mt-2 mb-8">This service may have been removed by the provider.</p>
       <button onClick={() => navigate('/directory')} className="bg-background text-foreground px-8 py-3 rounded-xl font-bold">Back to Directory</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-card">
      <PublicNavbar />

      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto">
        {/* BACK NAVIGATION */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10 group font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Return to Results</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* LEFT: MAIN CONTENT (2/3) */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl md:text-5xl font-black text-foreground mb-6 tracking-tight leading-tight">
                {service.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-8 mb-10 text-xs font-black uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-pale rounded-full flex items-center justify-center">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <span>{service.location || 'Regional CM'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" fill="currentColor" />
                  <span className="text-foreground">{service.rating || '4.9'} (Verified)</span>
                </div>
                {service.company?.isVerified && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <ShieldCheck size={18} />
                    <span>Cpromark Certified</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* GALLERY GRID (REAL DATA) */}
            <div className="grid grid-cols-2 gap-4 mb-16 h-[450px]">
              <div className="bg-muted rounded-[3rem] overflow-hidden shadow-xl border border-border">
                <img 
                  src={service.images?.[0] || "https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&q=80"} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                  alt="Service Main" 
                />
              </div>
              <div className="grid grid-rows-2 gap-4">
                <div className="bg-muted rounded-[2.5rem] overflow-hidden shadow-lg border border-border">
                  <img 
                    src={service.images?.[1] || "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?auto=format&fit=crop&q=80"} 
                    className="w-full h-full object-cover" 
                    alt="Detail 1" 
                  />
                </div>
                <div className="bg-muted rounded-[2.5rem] overflow-hidden relative shadow-lg border border-border group">
                  <img 
                    src={service.images?.[2] || "https://images.unsplash.com/photo-1482731215275-a1f151646268?auto=format&fit=crop&q=80"} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                    alt="More" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center font-black text-foreground text-sm uppercase tracking-widest">
                    + View All Photos
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION SECTION */}
            <section className="space-y-10">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Detailed Description</h3>
                <p className="text-foreground/70 leading-relaxed text-xl font-medium">
                  {service.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {service.features?.map((item: string) => (
                  <div key={item} className="flex items-center gap-4 p-6 bg-muted rounded-3xl border border-border group hover:bg-card hover:border-primary/20 transition-all">
                    <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-brand-navy shadow-lg shadow-yellow">
                       <CheckCircle2 size={16} />
                    </div>
                    <span className="font-black text-foreground text-xs uppercase tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT: ACTION SIDEBAR (1/3) */}
          <aside className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-28 bg-card rounded-[3.5rem] shadow-2xl border border-border p-10 flex flex-col"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-2">Estimate Starts At</p>
                  <h2 className="text-5xl font-black text-foreground tracking-tighter italic">
                    ${service.price?.toLocaleString()}
                  </h2>
                </div>
                <button className="p-4 bg-muted rounded-full text-foreground/35 hover:text-primary transition-colors border border-border shadow-sm">
                  <Share2 size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-10">
                <button className="w-full bg-background text-foreground py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary-dim transition-all shadow-xl shadow-yellow">
                  <Calendar size={18} />
                  Schedule Site Visit
                </button>
                <button className="w-full bg-card border-2 border-border text-foreground py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-muted transition-all">
                  <MessageSquare size={18} />
                  Connect with Expert
                </button>
              </div>

              <div className="p-6 bg-primary-pale/50 rounded-3xl border border-primary relative overflow-hidden">
                <ShieldCheck className="absolute right-[-10px] bottom-[-10px] text-primary/5 w-24 h-24" />
                <div className="flex gap-4 relative z-10">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow">
                    <ShieldCheck className="text-foreground" size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground uppercase tracking-tight">Cpromark Escrow</p>
                    <p className="text-[10px] text-brand-muted mt-1 font-medium leading-relaxed">Payments are only released once the project milestones are verified by our system.</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-10 border-t border-border text-center">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3">Service Provider</p>
                <Link 
                  to={`/company/${service.company?._id}`}
                  className="font-black text-foreground text-xl hover:text-primary transition-colors underline decoration-slate-200 underline-offset-8"
                >
                  {service.company?.name || 'Vertex Builders'}
                </Link>
              </div>
            </motion.div>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default ServiceDetail;