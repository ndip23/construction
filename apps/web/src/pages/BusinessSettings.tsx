import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import axios from 'axios';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { Camera, Save, MapPin, Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../theme';

interface CompanyProfile {
  website?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  sector?: string;
  address?: string;
  logo?: string;
  name?: string;
  slug?: string;
  status?: string;
  portfolio?: string[];
  receiptSettings?: {
    letterhead?: string;
    whatsappNumber?: string;
    taxId?: string;
    defaultTaxRate?: number;
    themeColor?: string;
    signature?: string;
    defaultPaymentTerms?: string;
    format?: 'standard' | 'modern' | 'minimal';
  };
}

const BusinessSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({});

  const getPersistedSlug = () => {
    try {
      const raw = localStorage.getItem('cpromark-storage');
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return parsed?.user?.slug || parsed?.state?.user?.slug;
    } catch { return undefined; }
  };

  const getApiErrorMessage = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) return (err.response?.data as { message?: string })?.message || fallback;
    if (err instanceof Error) return err.message;
    return fallback;
  };

  const { data: company, isLoading } = useQuery<CompanyProfile>({
    queryKey: ['company-profile'],
    queryFn: async () => (await apiClient.get('/auth/company/profile')).data,
    enabled: !!user,
  });

  const companySlug = company?.slug ?? user?.slug ?? getPersistedSlug();

  const effectiveFormData = {
    website: formData.website !== undefined ? formData.website : company?.website ?? '',
    email: formData.email !== undefined ? formData.email : company?.email ?? '',
    phone: formData.phone !== undefined ? formData.phone : company?.phone ?? '',
    city: formData.city !== undefined ? formData.city : company?.city ?? '',
    country: formData.country !== undefined ? formData.country : company?.country ?? '',
    sector: formData.sector !== undefined ? formData.sector : company?.sector ?? 'General Construction',
    address: formData.address !== undefined ? formData.address : company?.address ?? '',
    receiptSettings: {
      whatsappNumber: formData.receiptSettings?.whatsappNumber !== undefined ? formData.receiptSettings.whatsappNumber : company?.receiptSettings?.whatsappNumber ?? '',
      taxId: formData.receiptSettings?.taxId !== undefined ? formData.receiptSettings.taxId : company?.receiptSettings?.taxId ?? '',
      defaultTaxRate: formData.receiptSettings?.defaultTaxRate !== undefined ? formData.receiptSettings.defaultTaxRate : company?.receiptSettings?.defaultTaxRate ?? 0,
      themeColor: formData.receiptSettings?.themeColor !== undefined ? formData.receiptSettings.themeColor : company?.receiptSettings?.themeColor ?? '#000000',
      signature: formData.receiptSettings?.signature !== undefined ? formData.receiptSettings.signature : company?.receiptSettings?.signature ?? '',
      defaultPaymentTerms: formData.receiptSettings?.defaultPaymentTerms !== undefined ? formData.receiptSettings.defaultPaymentTerms : company?.receiptSettings?.defaultPaymentTerms ?? '',
      format: formData.receiptSettings?.format !== undefined ? formData.receiptSettings.format : company?.receiptSettings?.format ?? 'standard',
    }
  };

  useEffect(() => { return () => { if (tempLogo) URL.revokeObjectURL(tempLogo); }; }, [tempLogo]);

  const logoPreview = tempLogo || company?.logo;

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companySlug) { toast.error('Missing company slug.'); return; }
    const previewUrl = URL.createObjectURL(file);
    setTempLogo(previewUrl);
    e.target.value = '';
    const fd = new FormData();
    fd.append('file', file, file.name);
    const tid = toast.loading('Uploading logo...');
    try {
      await apiClient.post(`/auth/company/${companySlug}/logo`, fd);
      await queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      toast.success('Logo Updated', { id: tid });
    } catch { toast.dismiss(tid); setTempLogo(null); }
  };

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) => {
      if (!companySlug) return Promise.reject(new Error('Missing company slug'));
      return apiClient.put(`/auth/company/${companySlug}`, data);
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['company-profile'] }); 
      toast.success('Profile Updated');
    },
    onError: (err: unknown) => { toast.error(err instanceof Error ? err.message : 'Update failed'); },
  });

  const isUpdating = updateMutation.status === 'pending';

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  const fields = [
    { key: 'website', label: 'Business Website', placeholder: 'www.yourcompany.com' },
    { key: 'phone', label: 'Verified Phone', placeholder: '+237 600...' },
    { key: 'email', label: 'Business Email', placeholder: 'info@company.com' },
    { key: 'sector', label: 'Business Sector', placeholder: 'General Construction' },
    { key: 'city', label: 'City', placeholder: 'Douala' },
    { key: 'country', label: 'Country', placeholder: 'Cameroon' },
    { key: 'address', label: 'Physical Address', placeholder: 'Street, Quarter...' },
  ];

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto pb-40">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Edit Business Profile</h1>
          <p className="text-muted-foreground mt-2 font-medium">Update your business details for the public directory.</p>
        </header>

        {/* PROFILE CARD */}
        <div className="bg-card border border-border rounded-[3.5rem] overflow-hidden mb-12 shadow-sm">
          <div className="h-48 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/10 to-transparent" />
          </div>
          <div className="px-12 pb-12">
            <div className="relative -top-20 flex flex-col md:flex-row items-end gap-8 mb-6">
              <div className="w-44 h-44 bg-background rounded-[3rem] border-4 border-border overflow-hidden relative flex items-center justify-center group shrink-0">
                {logoPreview
                  ? <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" />
                  : <span className="text-6xl font-black text-foreground/20 italic">{company?.name?.charAt(0)}</span>
                }
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                >
                  <Camera className="text-foreground mb-2" size={32} />
                  <span className="text-[10px] text-foreground font-black uppercase tracking-widest text-center px-4">Update Logo</span>
                </div>
                <input type="file" ref={logoInputRef} className="hidden" onChange={handleLogoChange} accept="image/*" />
              </div>
              <div className="pb-10">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-black text-foreground tracking-tight">{company?.name}</h2>
                  {company?.status === 'verified' && <CheckCircle2 size={24} className="text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-primary" /> {effectiveFormData.city || 'City'}, {effectiveFormData.country || 'Country'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className={t.label + ' block px-1'}>{label}</label>
                  <input
                    value={(effectiveFormData as any)[key] || ''}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    className={t.input}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <button
                onClick={() => updateMutation.mutate(effectiveFormData as unknown as Record<string, string>)}
                disabled={!companySlug || isUpdating}
                className="flex items-center justify-center gap-3 bg-primary text-brand-navy rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all h-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default BusinessSettings;
