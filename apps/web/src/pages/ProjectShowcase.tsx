import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../theme';
import axios from 'axios';

interface CompanyProfile {
  slug?: string;
  portfolio?: string[];
}

const ProjectShowcase = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [tempGallery, setTempGallery] = useState<string[]>([]);

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

  useEffect(() => { return () => { tempGallery.forEach(url => URL.revokeObjectURL(url)); }; }, [tempGallery]);

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (!selectedFiles.length || !companySlug) return;
    const localUrls = selectedFiles.map(f => URL.createObjectURL(f));
    setTempGallery(prev => [...prev, ...localUrls]);
    e.target.value = '';
    const fd = new FormData();
    selectedFiles.forEach(f => fd.append('files', f, f.name));
    const tid = toast.loading('Uploading portfolio...');
    try {
      await apiClient.post(`/auth/company/${companySlug}/gallery`, fd);
      await queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      setTempGallery([]);
      toast.success('Portfolio Updated', { id: tid });
    } catch { toast.dismiss(tid); setTempGallery([]); }
  };

  const deleteImage = async (imageUrl: string) => {
    if (!companySlug) { toast.error('Missing company slug.'); return; }
    const tid = toast.loading('Removing image...');
    try {
      await apiClient.delete(`/auth/company/${companySlug}/gallery`, { data: { imageUrl } });
      await queryClient.invalidateQueries({ queryKey: ['company-profile'] });
      toast.success('Image Removed', { id: tid });
    } catch (err) { toast.error(getApiErrorMessage(err, 'Delete failed'), { id: tid }); }
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto pb-40">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-foreground">Project Showcase</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage the visual evidence of your completed construction works.</p>
        </header>

        {/* GALLERY */}
        <div className="bg-card border border-border rounded-[3.5rem] p-12 shadow-sm">
          <div className="flex justify-between items-center mb-10 px-2">
            <div>
              <h3 className="text-2xl font-black text-foreground">Gallery</h3>
              <p className={t.muted}>Upload high-quality images of your projects.</p>
            </div>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className={t.btnPrimary + ' flex items-center gap-2'}
            >
              <Plus size={16} /> Add Work
            </button>
            <input type="file" multiple ref={galleryInputRef} className="hidden" onChange={handleGalleryChange} accept="image/*" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {company?.portfolio?.map((url: string) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={url}
                  className="aspect-square rounded-[2.5rem] overflow-hidden relative group bg-muted border border-border"
                >
                  <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Portfolio" />
                  <div
                    onClick={() => deleteImage(url)}
                    className="absolute inset-0 bg-rose-600/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="text-foreground" size={28} />
                    <span className="text-[10px] text-foreground font-black mt-2 uppercase tracking-widest">Remove</span>
                  </div>
                </motion.div>
              ))}
              {tempGallery.map((url, i) => (
                <div key={`temp-${i}`} className="aspect-square rounded-[2.5rem] overflow-hidden relative border-2 border-primary/20 bg-muted">
                  <img src={url} className="w-full h-full object-cover opacity-40 blur-[1px]" alt="Uploading" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                </div>
              ))}
            </AnimatePresence>
            <div
              onClick={() => galleryInputRef.current?.click()}
              className="aspect-square rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center text-foreground/15 cursor-pointer hover:border-primary hover:text-primary transition-all hover:bg-muted/30"
            >
              <Plus size={40} className="mb-2" />
              <span className="text-[9px] font-black uppercase tracking-widest">Add Files</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default ProjectShowcase;
