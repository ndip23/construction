import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, Phone, User, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';


interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: {
    _id: string;
    name: string;
    phone?: string;
  };
}

export const ContactModal = ({ isOpen, onClose, company }: ContactModalProps) => {
  const [mode, setMode] = useState<'inquiry' | 'success'>('inquiry');
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    email: '',
    phone: '',
    location: '',
    message: ''
  });



  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.message) return toast.error("Name and message are required.");
    
    setIsLoading(true);
    try {
      await apiClient.post('/inquiries/submit', { ...form, companyId: company._id });
      setMode('success');
      
      if (company.phone) {
        const clean = company.phone.replace(/[^0-9]/g, '');
        let text = `Hello ${company.name}, I found your profile on Cpromark Africa.\n\n`;
        text += `*New Inquiry:*\n`;
        text += `Name: ${form.clientName}\n`;
        if (form.phone) text += `Phone: ${form.phone}\n`;
        if (form.location) text += `Location: ${form.location}\n`;
        text += `\nMessage: ${form.message}`;
        
        window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
      }
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send inquiry");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card w-full max-w-lg rounded-[2.5rem] border border-border shadow-2xl overflow-hidden relative"
        >
          <button
            onClick={() => { onClose(); setTimeout(() => setMode('inquiry'), 500); }}
            className="absolute top-6 right-6 p-2 rounded-full bg-muted text-muted-foreground hover:bg-foreground hover:text-background transition-all z-10"
          >
            <X size={20} />
          </button>

          <div className="p-8 md:p-10">


            {mode === 'inquiry' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-black tracking-tight">Project Inquiry</h2>
                </div>
                
                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Your Name *"
                        required
                        value={form.clientName}
                        onChange={e => setForm({...form, clientName: e.target.value})}
                        className="w-full bg-muted py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                        className="w-full bg-muted py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full bg-muted py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm"
                      />
                    </div>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Project Location"
                        value={form.location}
                        onChange={e => setForm({...form, location: e.target.value})}
                        className="w-full bg-muted py-4 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <textarea
                      required
                      placeholder="Describe what you need..."
                      value={form.message}
                      onChange={e => setForm({...form, message: e.target.value})}
                      className="w-full bg-muted p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-medium text-sm h-32 resize-none"
                    />
                  </div>
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="w-full bg-primary text-brand-navy py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 mt-4"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Submit Inquiry
                  </button>
                </form>
              </motion.div>
            )}

            {mode === 'success' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} className="text-primary" />
                </div>
                <h2 className="text-3xl font-black mb-2">Inquiry Sent!</h2>
                <p className="text-muted-foreground font-medium mb-8">
                  {company.name} has received your request and will get back to you shortly.
                </p>
                <button
                  onClick={() => { onClose(); setTimeout(() => setMode('inquiry'), 500); }}
                  className="px-8 py-3 bg-muted hover:bg-foreground hover:text-background rounded-2xl font-black text-sm transition-all"
                >
                  Close Window
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
