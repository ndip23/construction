import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import apiClient from '../api/client';
import { ShieldCheck, MapPin, Star, Phone, Mail, Globe, CheckCircle2, Loader2, ArrowLeft, MessageSquare, Award, Image as ImageIcon, Wrench, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { t } from '../theme';
import { ContactModal } from '../components/directory/ContactModal';

const PublicCompanyProfile = () => {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['public-company', slug],
    queryFn: async () => (await apiClient.get(`/explore/company/${slug}`)).data,
    enabled: !!slug,
  });


  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-primary mb-4 mx-auto" size={40} />
        <p className={t.label}>Opening Business Portfolio...</p>
      </div>
    </div>
  );

  if (isError || !company) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-3xl font-black text-foreground mb-4">Company Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">The firm you are looking for hasn't registered a public profile or the link has expired.</p>
      <button
        onClick={() => navigate('/directory')}
        className={t.btnSecondary + ' flex items-center gap-2'}
      >
        <ArrowLeft size={18} /> Back to Directory
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      <header className="relative pt-20">
        <div className="h-[450px] bg-card overflow-hidden relative">
          <img
            src={company.coverImage || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80'}
            className="w-full h-full object-cover opacity-30 grayscale hover:grayscale-0 transition-all duration-1000"
            alt="Cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative -mt-32 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-[4rem] p-10 shadow-2xl flex flex-col md:flex-row items-end gap-10"
          >
            <div className="w-48 h-48 bg-background rounded-[3.5rem] border-4 border-border overflow-hidden flex items-center justify-center shrink-0">
              {company.logo
                ? <img src={company.logo} className="w-full h-full object-cover" alt={company.name} />
                : <span className="text-7xl font-black text-foreground/20 italic">{company.name.charAt(0)}</span>
              }
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">{company.name}</h1>
                {company.status === 'verified' && <ShieldCheck className="text-primary" size={36} />}
              </div>
              <div className="flex flex-wrap items-center gap-8 text-muted-foreground font-black uppercase text-[10px] tracking-[0.2em]">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {company.city}, {company.country}</div>
                <div className="flex items-center gap-2 text-amber-400"><Star size={16} fill="currentColor" /> {company.rating || '5.0'} Rating</div>
                <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> Verified Entity</div>
              </div>
            </div>
            <div className="pb-4 w-full md:w-auto">
              <button onClick={() => setIsContactModalOpen(true)} className={t.btnPrimary + ' w-full md:w-auto px-12 py-5 text-sm'}>
                Hire This Company
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-16 pb-40">
        <div className="lg:col-span-2 space-y-20">
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-6">Corporate Profile</h2>
            <p className="text-foreground/70 leading-relaxed text-2xl font-medium tracking-tight">
              {company.description || "The company hasn't provided an official description yet."}
            </p>
          </motion.section>

          <section>
            <div className="flex items-center gap-4 mb-12">
              <div className={t.iconBoxNavy}>
                <Wrench size={20} />
              </div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">Services Offered</h2>
            </div>
            {company.offeredServices?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {company.offeredServices.map((svc: {
                  _id: string;
                  name: string;
                  category: string;
                  description?: string;
                  image?: string;
                  priceFrom?: number;
                  priceTo?: number;
                  unit?: string;
                }) => (
                  <motion.article
                    key={svc._id}
                    whileHover={{ y: -4 }}
                    className="bg-card border border-border rounded-[2.5rem] overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <div className="aspect-video bg-muted relative">
                      {svc.image ? (
                        <img src={svc.image} alt={svc.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/20">
                          <Wrench size={40} />
                        </div>
                      )}
                      <span className="absolute top-4 left-4 px-3 py-1 bg-background/80 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
                        {svc.category}
                      </span>
                    </div>
                    <div className="p-8">
                      <h3 className="text-xl font-black text-foreground mb-2">{svc.name}</h3>
                      {svc.description && (
                        <p className="text-sm text-foreground/60 leading-relaxed mb-4 line-clamp-3">{svc.description}</p>
                      )}
                      {(svc.priceFrom || svc.priceTo) && (
                        <p className="flex items-center gap-1 text-primary font-black text-sm">
                          <DollarSign size={14} />
                          {svc.priceFrom != null && Number(svc.priceFrom).toLocaleString()}
                          {svc.priceTo != null && ` – ${Number(svc.priceTo).toLocaleString()}`} XAF
                          {svc.unit && <span className="text-foreground/40 font-medium text-xs ml-1">/ {svc.unit}</span>}
                        </p>
                      )}
                    </div>
                  </motion.article>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border-4 border-dashed border-border rounded-[4rem]">
                <p className={t.label + ' italic'}>No public services listed yet</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-4 mb-12">
              <div className={t.iconBoxNavy}>
                <ImageIcon size={20} />
              </div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">Project Showcase</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {company.portfolio?.length > 0 ? (
                company.portfolio.map((url: string, index: number) => (
                  <motion.div
                    whileHover={{ y: -5 }}
                    key={index}
                    className="aspect-video rounded-[3rem] overflow-hidden border border-border bg-muted group cursor-zoom-in"
                  >
                    <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={`Project ${index + 1}`} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 py-20 text-center border-4 border-dashed border-border rounded-[4rem]">
                  <p className={t.label + ' italic'}>No Portfolio Images Uploaded</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="sticky top-28 bg-card border border-border p-12 rounded-[4rem] space-y-10 shadow-sm"
          >
            <h3 className={t.label + ' px-2'}>Official Channels</h3>
            <div className="space-y-8">
              {[
                { icon: Phone, label: 'Primary Line', value: company.phone || 'Request via Email' },
                { icon: Mail, label: 'Corporate Mail', value: company.email },
                { icon: Globe, label: 'Cloud Identity', value: company.website || 'No Website Linked' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-6 text-foreground group">
                  <div className="w-14 h-14 bg-muted border border-border rounded-[1.5rem] flex items-center justify-center text-primary group-hover:shadow-sm transition-all">
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-0.5">{label}</p>
                    <span className="font-black text-sm tracking-tight truncate block w-40">{value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-10 border-t border-border">
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="w-full py-5 bg-background border border-border text-foreground rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-3"
              >
                <MessageSquare size={20} /> Open Direct Chat
              </button>
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <Award size={14} />
                  <p className={t.label}>Cpromark Master Partner</p>
                </div>
                <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-widest italic">
                  Member since {new Date(company.createdAt).getFullYear()}
                </p>
              </div>
            </div>
          </motion.div>
        </aside>
      </main>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} company={company} />
    </div>
  );
};

export default PublicCompanyProfile;
