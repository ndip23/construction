import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import apiClient from '../api/client';
import {
  ShieldCheck,
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Award,
  Image as ImageIcon,
  Wrench,
  DollarSign,
  X,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { t } from '../theme';

type InquiryForm = {
  clientName: string;
  clientPhone: string;
  message: string;
};

const buildDefaultInquiryForm = (companyName: string): InquiryForm => ({
  clientName: localStorage.getItem('buildhub-inquiry-name') ?? '',
  clientPhone: localStorage.getItem('buildhub-inquiry-phone') ?? '',
  message: `Hello ${companyName || 'there'}, I found your profile on BuildHub Africa and I'd like to discuss a project.`,
});

const cleanPhone = (value: string) => value.replace(/[^0-9]/g, '');

const PublicCompanyProfile = () => {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    clientName: '',
    clientPhone: '',
    message: '',
  });

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['public-company', slug],
    queryFn: async () => (await apiClient.get(`/explore/company/${slug}`)).data,
    enabled: !!slug,
  });

  useEffect(() => {
    if (searchParams.get('inquire') === '1' && company && !isInquiryOpen) {
      setInquiryForm(buildDefaultInquiryForm(company.name));
      setIsInquiryOpen(true);
    }
  }, [company, isInquiryOpen, searchParams]);

  const openInquiryModal = () => {
    if (!company?.phone) {
      toast.error("This company hasn't provided a contact number yet.");
      return;
    }

    setInquiryForm(buildDefaultInquiryForm(company.name));
    setIsInquiryOpen(true);
    setSearchParams({ inquire: '1' }, { replace: true });
  };

  const closeInquiryModal = () => {
    setIsInquiryOpen(false);
    setSearchParams({}, { replace: true });
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company?.phone) {
      toast.error("This company hasn't provided a contact number yet.");
      return;
    }

    if (inquiryForm.clientName.trim().length < 2) {
      toast.error('Please add your name.');
      return;
    }

    if (cleanPhone(inquiryForm.clientPhone).length < 8) {
      toast.error('Please add a valid WhatsApp number.');
      return;
    }

    if (inquiryForm.message.trim().length < 10) {
      toast.error('Please add a short message.');
      return;
    }

    const chatWindow = window.open('', '_blank');
    if (!chatWindow) {
      toast.error('Please allow popups to continue to WhatsApp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data } = await apiClient.post('/inquiries/public', {
        companyId: company._id,
        clientName: inquiryForm.clientName.trim(),
        clientPhone: inquiryForm.clientPhone.trim(),
        message: inquiryForm.message.trim(),
        source: 'public_profile',
      });

      localStorage.setItem('buildhub-inquiry-name', inquiryForm.clientName.trim());
      localStorage.setItem('buildhub-inquiry-phone', inquiryForm.clientPhone.trim());

      closeInquiryModal();

      if (data?.whatsappUrl) {
        chatWindow.location.href = data.whatsappUrl;
      } else {
        chatWindow.close();
        toast.error('WhatsApp link unavailable.');
      }
    } catch {
      chatWindow.close();
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <button onClick={openInquiryModal} className={t.btnPrimary + ' w-full md:w-auto px-12 py-5 text-sm flex items-center justify-center gap-3'}>
                <MessageSquare size={18} /> Send Inquiry
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
onClick={handleWhatsApp}
                className="w-full py-5 bg-background border border-border text-foreground rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-muted transition-all flex items-center justify-center gap-3"
              >
                <MessageSquare size={20} /> Send Inquiry
              </button>
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <Award size={14} />
                  <p className={t.label}>BuildHub Master Partner</p>
                </div>
                <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-widest italic">
                  Member since {new Date(company.createdAt).getFullYear()}
                </p>
              </div>
            </div>
          </motion.div>
        </aside>
      </main>

      <AnimatePresence>
        {isInquiryOpen && (
          <motion.div
            className={t.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className={t.modal + ' relative overflow-hidden'}
            >
              <button
                type="button"
                onClick={closeInquiryModal}
                className="absolute right-6 top-6 w-10 h-10 rounded-2xl bg-brand-navy-light border border-brand-border flex items-center justify-center text-white/45 hover:text-white hover:bg-brand-navy transition-all"
                aria-label="Close inquiry form"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4 mb-8 pr-12">
                <div className={t.iconBoxYellow}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{company.name}</h3>
                  <p className="text-white/45 text-sm font-medium">Send a WhatsApp inquiry</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleInquirySubmit}>
                <div className="space-y-2">
                  <label className={t.label + ' px-2'}>Your Name</label>
                  <input
                    value={inquiryForm.clientName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, clientName: e.target.value })}
                    className={t.input}
                    placeholder="Full name"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <label className={t.label + ' px-2'}>WhatsApp Number</label>
                  <input
                    value={inquiryForm.clientPhone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, clientPhone: e.target.value })}
                    className={t.input}
                    placeholder="+237 6XX XXX XXX"
                    autoComplete="tel"
                  />
                </div>

                <div className="space-y-2">
                  <label className={t.label + ' px-2'}>Message</label>
                  <textarea
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    className={t.textarea + ' h-40'}
                    placeholder="Write your inquiry"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-brand-yellow text-brand-navy rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-yellow hover:bg-brand-yellow-dim transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  Send to WhatsApp
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicCompanyProfile;
