import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { useAuthStore } from '../../store/useAuthStore';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '../../store/useCurrencyStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import {
  Wallet, Building2, Wrench, CheckCircle2, ArrowRight, Loader2,
  Phone, Globe, MapPin, Briefcase, DollarSign, ImagePlus, Camera,
  LayoutDashboard, Calculator, Store, FileText, Inbox, Lock, X,
} from 'lucide-react';

// ─── Tour steps ────────────────────────────────────────────────────
const TOUR = [
  { icon: LayoutDashboard, color: 'bg-primary', title: 'Command Centre', desc: 'Real-time snapshot of your projects, invoices, tenders and business health.' },
  { icon: Wrench,          color: 'bg-primary', title: 'My Services',     desc: 'List your specialties. They show on your public directory profile for clients to find you.' },
  { icon: Calculator,      color: 'bg-rose-500',     title: 'BOQ Engine',      desc: 'Generate precise Bills of Quantities verified before export — no pricing errors.' },
  { icon: Store,           color: 'bg-emerald-500',  title: 'Marketplace',     desc: 'Source materials from verified suppliers. Live pricing syncs straight into your BOQs.' },
  { icon: FileText,        color: 'bg-purple-600',   title: 'Invoices',        desc: 'Professional invoices, payment tracking, and full P&L reports in one place.' },
  { icon: Inbox,           color: 'bg-orange-500',   title: 'Inquiries',       desc: 'Clients contact you through the directory. Fast replies win more contracts.' },
];

// ─── Shared card shell ──────────────────────────────────────────────
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-card rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-border">
    {children}
  </div>
);

const CardHeader = ({
  step, totalSteps, icon: Icon, title, sub,
}: {
  step: number; totalSteps: number; icon: React.ElementType;
  title: string; sub: string;
}) => (
  <div className="bg-[#040d1a] px-10 pt-10 pb-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-brand-navy text-sm italic shrink-0">BH</div>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all ${i < step ? 'w-6 bg-primary' : i === step - 1 ? 'w-8 bg-primary' : 'w-4 bg-white/15'}`} />
        ))}
      </div>
      <span className="ml-auto text-[10px] font-black text-foreground/40 uppercase tracking-widest">Step {step} / {totalSteps}</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center">
        <Icon size={26} className="text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">{title}</h1>
        <p className="text-sm text-foreground/45 font-medium mt-0.5">{sub}</p>
      </div>
    </div>
  </div>
);

const COUNTRY_CURRENCY: Record<string, string> = {
  CM: 'XAF', SN: 'XOF', CI: 'XOF', BJ: 'XOF', BF: 'XOF', ML: 'XOF',
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', EG: 'EGP',
  US: 'USD', GB: 'GBP',
};

const getCountryCodeFromLocale = (locale: string) => {
  const match = locale.match(/[-_ ]([A-Za-z]{2})$/);
  return match ? match[1].toUpperCase() : '';
};

const getCurrencyForCountryCode = (countryCode: string) =>
  COUNTRY_CURRENCY[countryCode] || 'USD';

// ─── Input helper ───────────────────────────────────────────────────
const Field = ({
  label, icon: Icon, placeholder, value, onChange, type = 'text',
}: {
  label: string; icon: React.ElementType; placeholder: string;
  value: string; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1 block">{label}</label>
    <div className="relative">
      <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3.5 bg-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium text-foreground placeholder-white/25 border border-white/5"
      />
    </div>
  </div>
);

// ─── STEP 1: Wallet Top-Up ──────────────────────────────────────────
const WalletStep = ({ onDone }: { onDone: () => void }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const handleGoTopUp = () => {
    // This will now successfully show the wallet page because the gate will hide itself
    navigate('/dashboard/wallet');
  };

  const checkBalance = async () => {
    setChecking(true);
    try {
      // Check the actual wallet balance instead of dashboard profit summary
      const { data } = await apiClient.get('/wallet/balance');
      if ((data.balance ?? 0) > 0) {
        toast.success('Wallet funded! Continuing setup…');
        onDone();
      } else {
        toast.error('Your wallet balance is still 0. Please complete a top-up first.');
      }
    } catch {
      toast.error('Could not check balance. Try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader
        step={1} totalSteps={4}
        icon={Wallet}
        title="Fund Your Workspace"
        sub="Top up your wallet to unlock all platform features."
      />
      <div className="p-10 space-y-6">
          <div className="bg-card rounded-3xl p-6 border border-border space-y-3">
          {[
            'You top up in USD, while payment is charged in your local currency.',
            'The wallet keeps your deposit amount in USD for consistent reporting.',
            'Auto-detected country and currency for your current location.',
            'Return here after funding and continue with the setup.',
          ].map((point) => (
            <div key={point} className="flex items-start gap-3">
              <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/60 font-medium">{point}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGoTopUp}
          className="w-full py-4 bg-primary text-brand-navy rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-yellow"
        >
          <Wallet size={18} /> Go to Wallet
        </button>

        <button
          type="button"
          onClick={checkBalance}
          disabled={checking}
          className="w-full py-3.5 bg-white/5 text-foreground/70 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-border hover:bg-white/10 transition-all"
        >
          {checking ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          I already topped up — verify balance
        </button>
      </div>
    </Card>
  );
};

// ─── STEP 3: First Service ──────────────────────────────────────────
const CATEGORIES = [
  'General Construction', 'Civil Engineering', 'Electrical Works',
  'Plumbing & Sanitation', 'Roofing', 'Interior Finishing',
  'Landscaping', 'Project Management', 'Architectural Design', 'Other',
];

const ProfileStep = ({ onDone }: { onDone: () => void }) => {
  const [form, setForm] = useState({ phone: '', sector: '', city: '', country: '', website: '', address: '' });
  const [loading, setLoading] = useState(false);
  const f = (k: keyof typeof form) => (v: string) => setForm((s) => ({ ...s, [k]: v }));
  const { user } = useAuthStore();

  const handleSave = async () => {
    if (!form.phone || !form.sector) return toast.error('Phone and sector are required.');
    setLoading(true);
    try {
      await apiClient.put(`/auth/company/${user?.slug}`, form);
      toast.success('Business profile saved!');
      onDone();
    } catch {
      toast.error('Save failed — you can update this in Settings later.');
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader step={2} totalSteps={4} icon={Building2} title="Business Profile" sub="Help clients find you — takes about 60 seconds." />
      <div className="p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Field label="Phone / WhatsApp *" icon={Phone}    placeholder="+237 6XX XXX XXX"      value={form.phone}   onChange={f('phone')} />
          <Field label="Business Sector *"  icon={Briefcase} placeholder="e.g. General Contractor" value={form.sector} onChange={f('sector')} />
          <Field label="City"               icon={MapPin}   placeholder="e.g. Douala"            value={form.city}    onChange={f('city')} />
          <Field label="Country"            icon={Globe}    placeholder="e.g. Cameroon"          value={form.country} onChange={f('country')} />
          <Field label="Website (optional)" icon={Globe}    placeholder="https://..."            value={form.website} onChange={f('website')} />
          <Field label="Physical Address"   icon={MapPin}   placeholder="Street, Quarter..."     value={form.address} onChange={f('address')} />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onDone} className="px-6 py-3.5 bg-white/5 text-muted-foreground rounded-2xl font-bold text-sm hover:text-foreground transition-all border border-white/5">
            Skip for now
          </button>
          <button type="button" onClick={handleSave} disabled={loading} className="flex-1 py-3.5 bg-primary text-brand-navy rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-yellow disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={18} /> Save & Continue</>}
          </button>
        </div>
      </div>
    </Card>
  );
};

const ServiceStep = ({ onDone }: { onDone: () => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', category: '', description: '', priceFrom: '', priceTo: '', unit: 'project', isPublic: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const f = (k: keyof typeof form) => (v: string) => setForm((s) => ({ ...s, [k]: v }));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.name || !form.category) return toast.error('Name and category are required.');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('unit', form.unit);
      fd.append('isPublic', String(form.isPublic));
      if (form.priceFrom) fd.append('priceFrom', form.priceFrom);
      if (form.priceTo) fd.append('priceTo', form.priceTo);
      if (imageFile) fd.append('file', imageFile, imageFile.name);
      await apiClient.post('/services', fd);
      toast.success('First service created! Your profile is live.');
      onDone();
    } catch {
      toast.error('Failed to save service — you can add services from the sidebar later.');
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader step={3} totalSteps={4} icon={Wrench} title="Add Your First Service" sub="This makes you visible in the public directory." />
      <div className="p-10 space-y-5">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2 block">Service Photo</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="relative aspect-video max-w-sm rounded-3xl overflow-hidden border-2 border-dashed border-white/10 bg-white/5 cursor-pointer group hover:border-primary/30 transition-all"
          >
            {preview
              ? <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              : <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground/30 gap-2">
                  <ImagePlus size={28} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest">Upload photo</span>
                </div>
            }
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={24} className="text-primary" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Service Name *" icon={Wrench}    placeholder="e.g. Foundation Works" value={form.name}     onChange={f('name')} />
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1 block">Category *</label>
            <select value={form.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => f('category')(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium text-foreground border border-white/5 appearance-none">
              <option value="" className="bg-[#0a1628]">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0a1628]">{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => f('description')(e.target.value)} placeholder="Describe what this service includes…"
              className="w-full px-4 py-3.5 bg-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium text-foreground placeholder-white/25 border border-white/5 h-20 resize-none" />
          </div>
          <Field label="Price From" icon={DollarSign} placeholder="e.g. 50000" value={form.priceFrom} onChange={f('priceFrom')} type="number" />
          <Field label="Price To"   icon={DollarSign} placeholder="e.g. 500000" value={form.priceTo}  onChange={f('priceTo')}  type="number" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onDone} className="px-6 py-3.5 bg-white/5 text-muted-foreground rounded-2xl font-bold text-sm hover:text-foreground transition-all border border-white/5">
            Skip for now
          </button>
          <button type="button" onClick={handleSave} disabled={loading} className="flex-1 py-3.5 bg-primary text-brand-navy rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-yellow disabled:opacity-60">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><ArrowRight size={18} /> Save Service & Continue</>}
          </button>
        </div>
      </div>
    </Card>
  );
};

const TourStep = ({ onDone }: { onDone: () => void }) => {
  const [step, setStep] = useState(0);
  const item = TOUR[step];
  const Icon = item.icon;

  return (
    <div className="bg-[#0a1628] rounded-[3rem] w-full max-w-md shadow-2xl p-10 relative border border-white/5 mx-auto">
      <button type="button" onClick={onDone} className="absolute top-6 right-6 text-muted-foreground/50 hover:text-foreground/70 transition-colors">
        <X size={20} />
      </button>

      <div className={`w-16 h-16 ${item.color} rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl`}>
        <Icon size={28} className="text-[#001529]" />
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2">Feature {step + 1} of {TOUR.length}</p>
      <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">{item.title}</h2>
      <p className="text-foreground/55 font-medium leading-relaxed text-sm mb-8">{item.desc}</p>

      <div className="flex gap-2 mb-8">
        {TOUR.map((_, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/50' : 'w-4 bg-white/15'}`} />
        ))}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)}
            className="px-5 py-3 bg-white/5 text-foreground/60 rounded-2xl font-bold text-sm hover:text-foreground transition-all border border-white/5">
            Back
          </button>
        )}
        <button type="button"
          onClick={() => step < TOUR.length - 1 ? setStep(step + 1) : onDone()}
          className="flex-1 py-3 bg-primary text-brand-navy rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
          {step === TOUR.length - 1
            ? <><CheckCircle2 size={16} /> Enter Dashboard</>
            : <>Next <ArrowRight size={16} /></>}
        </button>
      </div>

      {step === 0 && (
        <button type="button" onClick={onDone}
          className="w-full text-center text-xs text-muted-foreground/50 mt-4 hover:text-muted-foreground transition-colors">
          Skip tour
        </button>
      )}
    </div>
  );
};

// ─── Main gate ─────────────────────────────────────────────────────
export const OnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { getStep, advance, markDone, isDone } = useOnboardingStore();
  const { setCurrency } = useCurrencyStore();
  const localeSynced = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  const step = getStep(user?.id ?? '');
  const done = isDone(user?.id ?? '');

  useEffect(() => {
    if (!user?.id || step !== 'wallet' || localeSynced.current) return;

    const locale = navigator.language || navigator.languages?.[0] || '';
    const countryCode = getCountryCodeFromLocale(locale);
    const currencyCode = getCurrencyForCountryCode(countryCode);
    const matchedCurrency = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);

    if (matchedCurrency) {
      setCurrency(matchedCurrency);
    }

    if (countryCode && currencyCode) {
      apiClient.put('/auth/company/profile', {
        countryCode,
        currency: currencyCode,
      }).catch(() => {
        // silent fallback if backend update fails
      });
    }

    localeSynced.current = true;
  }, [user?.id, step, setCurrency]);

  useEffect(() => {
    if (!user?.id || done) return;

    if (step === 'wallet' && !location.pathname.includes('/dashboard/wallet')) {
      navigate('/dashboard/wallet', { replace: true });
    }

    if (step === 'profile' && location.pathname !== '/dashboard/settings/business') {
      navigate('/dashboard/settings/business', { replace: true });
    }

    if (step === 'service' && !location.pathname.includes('/dashboard/services')) {
      navigate('/dashboard/services', { replace: true });
    }

    if (step === 'tour' && location.pathname !== '/dashboard') {
      navigate('/dashboard', { replace: true });
    }
  }, [done, step, location.pathname, navigate, user?.id]);

  if (!isAuthenticated || !user?.id) return <>{children}</>;

  // Identify if we are currently on the wallet page
  const isCurrentlyOnWallet = location.pathname.includes('/wallet');

  // IF onboarding is complete OR user is literally ON the wallet page,
  // we do NOT show the lock overlay.
  if (done || (step === 'wallet' && isCurrentlyOnWallet)) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen">
      {/* blurred backdrop showing the real dashboard */}
      <div className="blur-xl pointer-events-none select-none opacity-40 fixed inset-0 z-0">
        {children}
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040d17]/95 backdrop-blur-md">
        {/* lock badge top-right */}
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
            <Lock size={12} className="text-primary" />
            Setup required — step {['wallet', 'profile', 'service', 'tour'].indexOf(step) + 1}/4
        </div>

        <AnimatePresence mode="wait">
            {step === 'wallet' && (
            <motion.div key="wallet" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <WalletStep onDone={() => advance(user.id)} />
            </motion.div>
            )}

            {step === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <ProfileStep onDone={() => advance(user.id)} />
            </motion.div>
            )}

            {step === 'service' && (
            <motion.div key="service" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <ServiceStep onDone={() => advance(user.id)} />
            </motion.div>
            )}

            {step === 'tour' && (
            <motion.div key="tour" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <TourStep onDone={() => markDone(user.id)} />
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};