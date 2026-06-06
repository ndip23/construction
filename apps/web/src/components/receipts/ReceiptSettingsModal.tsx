import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2, Save, X, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '../../theme';
import { motion, AnimatePresence } from 'framer-motion';

interface ReceiptSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptSettingsModal = ({ isOpen, onClose }: ReceiptSettingsModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<any>({});

  const getPersistedSlug = () => {
    try {
      const raw = localStorage.getItem('cpromark-storage');
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      return parsed?.user?.slug || parsed?.state?.user?.slug;
    } catch { return undefined; }
  };

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => (await apiClient.get('/auth/company/profile')).data,
    enabled: isOpen && !!user,
  });

  const companySlug = company?.slug ?? user?.slug ?? getPersistedSlug();

  useEffect(() => {
    if (company?.receiptSettings) {
      setFormData(company.receiptSettings);
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      if (!companySlug) return Promise.reject(new Error('Missing company slug'));
      return apiClient.put(`/auth/company/${companySlug}`, { receiptSettings: data });
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['company-profile'] }); 
      toast.success('Receipt Settings Updated');
      onClose();
    },
    onError: (err: unknown) => { toast.error(err instanceof Error ? err.message : 'Update failed'); },
  });

  const isUpdating = updateMutation.status === 'pending';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-border w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Settings2 size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground">Smart Receipt Settings</h3>
                  <p className="text-sm text-muted-foreground font-medium">Configure default layout, tax, and branding.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <X size={24} className="text-muted-foreground" />
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className={t.label + ' block px-1'}>Default Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.defaultTaxRate || 0}
                    onChange={e => setFormData({ ...formData, defaultTaxRate: Number(e.target.value) })}
                    className={t.input}
                  />
                </div>
                <div className="space-y-1">
                  <label className={t.label + ' block px-1'}>Tax ID / VAT Number</label>
                  <input
                    type="text"
                    value={formData.taxId || ''}
                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                    className={t.input}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1">
                  <label className={t.label + ' block px-1'}>WhatsApp Number (for receipts)</label>
                  <input
                    type="text"
                    value={formData.whatsappNumber || ''}
                    onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className={t.input}
                    placeholder="+237..."
                  />
                </div>
                <div className="space-y-1">
                  <label className={t.label + ' block px-1'}>Default Payment Terms</label>
                  <input
                    type="text"
                    value={formData.defaultPaymentTerms || ''}
                    onChange={e => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
                    className={t.input}
                    placeholder="e.g. Due on receipt"
                  />
                </div>
                <div className="space-y-1">
                  <label className={t.label + ' block px-1'}>Layout Format</label>
                  <select
                    value={formData.format || 'standard'}
                    onChange={e => setFormData({ ...formData, format: e.target.value as 'standard' | 'modern' | 'minimal' })}
                    className={t.input}
                  >
                    <option value="standard">Standard</option>
                    <option value="modern">Modern (Bordered)</option>
                    <option value="minimal">Minimal (Clean)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={t.label + ' block px-1'}>Theme Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formData.themeColor || '#000000'}
                      onChange={e => setFormData({ ...formData, themeColor: e.target.value })}
                      className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={formData.themeColor || '#000000'}
                      onChange={e => setFormData({ ...formData, themeColor: e.target.value })}
                      className={t.input}
                    />
                  </div>
                </div>
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className={t.label + ' block px-1'}>Digital Signature (Name or Image URL)</label>
                  <input
                    type="text"
                    value={formData.signature || ''}
                    onChange={e => setFormData({ ...formData, signature: e.target.value })}
                    className={t.input}
                    placeholder="John Doe or https://..."
                  />
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-border flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 text-muted-foreground hover:text-foreground font-black text-xs uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateMutation.mutate(formData)}
                disabled={!companySlug || isUpdating || isLoading}
                className="flex items-center justify-center gap-2 bg-primary text-brand-navy rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
