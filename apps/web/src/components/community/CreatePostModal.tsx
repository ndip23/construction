import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { X, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CreatePostModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    urgency: 'Medium',
    description: ''
  });

  const categories = [
    'Structural Engineering', 'Electrical Systems', 'Plumbing & Water', 
    'Roofing', 'Finishing Works', 'Materials', 'Cost Estimation', 'General'
  ];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/community/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      onClose();
      setFormData({ title: '', category: '', location: '', urgency: 'Medium', description: '' });
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card w-full max-w-2xl rounded-[2.5rem] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 md:p-8 flex items-center justify-between border-b border-border bg-muted/30">
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tighter">Ask the Community</h2>
              <p className="text-muted-foreground text-sm font-medium mt-1">Get expert advice and solutions for your project.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors">
              <X size={24} className="text-foreground" />
            </button>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Problem / Question</label>
              <input
                type="text"
                placeholder="E.g. Cracks appearing on wall after plastering"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-foreground focus:outline-none focus:border-primary/50"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Category</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-foreground focus:outline-none focus:border-primary/50"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, Country"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-foreground focus:outline-none focus:border-primary/50"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</label>
              <textarea
                placeholder="Describe the issue in detail. What have you tried? What materials are you using?"
                rows={5}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-foreground focus:outline-none focus:border-primary/50 resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Urgency</label>
              <div className="flex gap-3">
                {['Low', 'Medium', 'High', 'Critical'].map(level => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, urgency: level })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                      formData.urgency === level 
                        ? 'bg-primary text-brand-navy border-primary' 
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 font-bold text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.title || !formData.description || !formData.category}
              className="bg-foreground text-background px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary hover:text-brand-navy transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
              Post Question
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
