import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { useCurrencyStore } from '../store/useCurrencyStore';
import {
  Plus, Trash2, Loader2, Wrench, CheckCircle2,
  DollarSign, Clock, Tag, Globe, Lock, ImagePlus, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'General Construction', 'Civil Engineering', 'Electrical Works',
  'Plumbing & Sanitation', 'Roofing', 'Interior Finishing',
  'Landscaping', 'Project Management', 'Architectural Design', 'Other'
];

const emptyForm = {
  name: '', category: '', description: '', priceFrom: '', priceTo: '', unit: 'project', isPublic: true
};

const Services = () => {
  const queryClient = useQueryClient();

  const { format, currency } = useCurrencyStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingServiceId, setUploadingServiceId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['company-services'],
    queryFn: async () => {
      const { data } = await apiClient.get('/services');
      return data;
    }
  });

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setShowForm(false);
  };

  const addMutation = useMutation({
    mutationFn: async (payload: typeof form & { imageFile: File | null }) => {
      const fd = new FormData();
      fd.append('name', payload.name);
      fd.append('category', payload.category);
      fd.append('description', payload.description);
      fd.append('unit', payload.unit);
      fd.append('isPublic', String(payload.isPublic));
      if (payload.priceFrom) fd.append('priceFrom', payload.priceFrom);
      if (payload.priceTo) fd.append('priceTo', payload.priceTo);
      if (payload.imageFile) fd.append('file', payload.imageFile, payload.imageFile.name);
      const { data } = await apiClient.post('/services', fd);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-services'] });
      toast.success('Service added — visible on your directory profile!');
      resetForm();
    },
    onError: () => toast.error('Failed to add service.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-services'] });
      toast.success('Service removed.');
    }
  });

  const imageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append('file', file, file.name);
      const { data } = await apiClient.post(`/services/${id}/image`, fd);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-services'] });
      toast.success('Service image updated.');
      setUploadingServiceId(null);
    },
    onError: () => {
      toast.error('Image upload failed.');
      setUploadingServiceId(null);
    }
  });

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    setImageFile(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleCardImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const serviceId = uploadingServiceId;
    if (!file || !serviceId) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    imageMutation.mutate({ id: serviceId, file });
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (!form.name || !form.category) return toast.error('Name and category are required.');
    addMutation.mutate({ ...form, imageFile });
  };

  return (
    <DashboardShell>
      <input
        ref={cardImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCardImagePick}
      />

      <div className="max-w-[1400px] mx-auto pb-20">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">My Services</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Add construction services with photos. Public services appear on your company directory page.
            </p>
          </div>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-brand-navy rounded-2xl font-black text-sm shadow-yellow hover:scale-[1.02] transition-all"
          >
            <Plus size={18} /> Add Service
          </button>
        </header>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="bg-card rounded-[2.5rem] border border-primary/30 shadow-yellow p-8 mb-8"
            >
              <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                <Wrench size={18} className="text-primary" /> New Service
              </h3>

              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-2 block">Service Photo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video max-w-md rounded-3xl overflow-hidden border-2 border-dashed border-border bg-muted cursor-pointer group hover:border-primary/40 transition-all"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground/40 gap-2">
                      <ImagePlus size={32} className="text-primary" />
                      <span className="text-xs font-bold uppercase tracking-widest">Upload service image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={28} className="text-primary" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1 block">Service Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Residential Foundation Works"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full p-4 bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm border-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1 block">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full p-4 bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm border-none text-foreground"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1 block">Description</label>
                  <textarea
                    placeholder="Describe what this service includes..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full p-4 bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm border-none h-24 resize-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1 block">Price From ({currency.code})</label>
                  <input
                    type="number"
                    placeholder="50,000"
                    value={form.priceFrom}
                    onChange={e => setForm({ ...form, priceFrom: e.target.value })}
                    className="w-full p-4 bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm border-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1 block">Price To ({currency.code})</label>
                  <input
                    type="number"
                    placeholder="500,000"
                    value={form.priceTo}
                    onChange={e => setForm({ ...form, priceTo: e.target.value })}
                    className="w-full p-4 bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm border-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1 block">Pricing Unit</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full p-4 bg-muted rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm border-none text-foreground"
                  >
                    {['project', 'm²', 'm³', 'unit', 'day', 'hour'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6 pl-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                    className={`w-12 h-6 rounded-full transition-all ${form.isPublic ? 'bg-primary' : 'bg-muted'} relative`}
                  >
                    <div className={`w-5 h-5 bg-card rounded-full absolute top-0.5 transition-all shadow ${form.isPublic ? 'left-6' : 'left-0.5'}`} />
                  </button>
                  <span className="text-sm font-bold text-foreground/70 flex items-center gap-1">
                    {form.isPublic ? <Globe size={14} className="text-primary" /> : <Lock size={14} />}
                    {form.isPublic ? 'Visible on public directory' : 'Hidden from directory'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={resetForm} className="px-6 py-3 text-muted-foreground font-black text-sm hover:text-foreground">Cancel</button>
                <button
                  onClick={handleSubmit}
                  disabled={addMutation.isPending}
                  className="px-8 py-3 bg-primary text-brand-navy rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-[1.02] transition-all"
                >
                  {addMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Save Service
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-foreground/35 animate-pulse font-bold">
            <Loader2 className="animate-spin mr-2" /> Loading services...
          </div>
        ) : services?.length === 0 ? (
          <div className="bg-card border border-border p-20 rounded-[3rem] border-2 border-dashed text-center">
            <Wrench className="mx-auto text-foreground/15 mb-4" size={48} />
            <h3 className="text-xl font-bold text-muted-foreground">No services yet</h3>
            <p className="text-xs text-foreground/35 mt-1 uppercase font-black tracking-widest">Add your first service to appear in the directory</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {services?.map((svc: any) => (
              <motion.div
                key={svc._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-[2rem] border border-border overflow-hidden hover:shadow-card hover:border-primary/30 transition-all group"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  {svc.image ? (
                    <img src={svc.image} alt={svc.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
                      <Wrench size={32} />
                      <span className="text-[10px] font-black uppercase tracking-widest">No image</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setUploadingServiceId(svc._id);
                      cardImageInputRef.current?.click();
                    }}
                    disabled={imageMutation.isPending && uploadingServiceId === svc._id}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-background/80 backdrop-blur text-foreground text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-brand-navy"
                  >
                    {imageMutation.isPending && uploadingServiceId === svc._id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Camera size={12} />}
                    {svc.image ? 'Change' : 'Add photo'}
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${svc.isPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-muted-foreground'}`}>
                      {svc.isPublic ? 'On directory' : 'Hidden'}
                    </span>
                    <button
                      onClick={() => deleteMutation.mutate(svc._id)}
                      className="p-2 rounded-xl hover:bg-rose-500/20 hover:text-rose-400 text-foreground/35 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-black text-foreground text-base mb-1">{svc.name}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-3">
                    <Tag size={10} /> {svc.category}
                  </span>
                  {svc.description && (
                    <p className="text-xs text-foreground/60 font-medium mb-4 leading-relaxed line-clamp-2">{svc.description}</p>
                  )}
                  {(svc.priceFrom || svc.priceTo) && (
                    <div className="flex items-center gap-1 text-primary font-black text-sm">
                      <DollarSign size={14} />
                      {svc.priceFrom && format(Number(svc.priceFrom))}
                      {svc.priceTo && ` – ${format(Number(svc.priceTo))}`}
                      <span className="text-foreground/35 font-medium text-xs ml-1 flex items-center gap-1">
                        <Clock size={10} /> / {svc.unit}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default Services;
