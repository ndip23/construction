import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../api/client';
import { Save, Plus, Trash2, ArrowLeft, Wand2, Loader2, Sparkles, Receipt as ReceiptIcon, User, CreditCard } from 'lucide-react';
import { t } from '../theme';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateReceipt() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdReceiptId, setCreatedReceiptId] = useState<string | null>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const { data: recentClients } = useQuery({
    queryKey: ['recentClients'],
    queryFn: async () => {
      const { data } = await apiClient.get('/receipts/clients/recent');
      return data;
    }
  });



  const { data: company } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/company/profile');
      return data;
    },
    enabled: !!user?.companyId
  });

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    status: 'draft',
    notes: '',
    paymentMethod: ''
  });

  const filteredClients = Array.isArray(recentClients) 
    ? recentClients.filter((c: any) => 
        typeof c.name === 'string' && c.name.toLowerCase().includes((formData.clientName || '').toLowerCase())
      ) 
    : [];

  const handleSelectClient = (client: any) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.name,
      clientEmail: client.email || prev.clientEmail,
      clientPhone: client.phone || prev.clientPhone,
      clientAddress: client.address || prev.clientAddress
    }));
    setShowClientDropdown(false);
  };

  const [items, setItems] = useState([
    { description: '', quantity: 1, rate: 0, total: 0 }
  ]);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    newItems[index].total = newItems[index].quantity * newItems[index].rate;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, rate: 0, total: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = company?.receiptSettings?.defaultTaxRate || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        client: {
          name: formData.clientName,
          email: formData.clientEmail,
          phone: formData.clientPhone,
          address: formData.clientAddress
        },
        items,
        status: formData.status,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
        currency: company?.currency || 'USD'
      };
      const { data } = await apiClient.post('/receipts', payload);
      return data;
    },
    onSuccess: (data) => {
      setCreatedReceiptId(data._id);
      setShowSuccessModal(true);
      toast.success('Receipt generated successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create receipt');
    }
  });

  const handleAiAssist = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      const { data } = await apiClient.post('/receipts/ai-parse', { prompt: aiPrompt });
      
      setFormData(prev => ({
        ...prev,
        clientName: data.clientName || prev.clientName,
        clientEmail: data.clientEmail || prev.clientEmail,
        clientPhone: data.clientPhone || prev.clientPhone,
        clientAddress: data.clientAddress || prev.clientAddress,
        status: data.status || prev.status,
        notes: data.notes || prev.notes
      }));

      if (data.items && data.items.length > 0) {
        setItems(data.items);
      }
      
      setAiPrompt('');
      toast.success('AI successfully filled the details!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to parse prompt with AI');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto pb-24">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6 mb-10 pb-8 border-b border-border">
          <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-card border border-border hover:bg-muted transition-all group">
            <ArrowLeft className="w-5 h-5 text-foreground group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Receipt Builder</span>
            </div>
            <h1 className={t.h2}>Create Smart Receipt</h1>
          </div>
        </motion.div>

        {/* AI Assistant Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-12 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-primary/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity rounded-[3rem] -z-10" />
          <div className="bg-card border border-border rounded-[2.5rem] p-3 pl-8 flex items-center gap-4 shadow-xl">
             <div className="bg-blue-500/10 p-3 rounded-full shrink-0">
               <Sparkles className="w-6 h-6 text-blue-500" />
             </div>
             <input 
               ref={aiInputRef}
               type="text" 
               placeholder="AI Magic: e.g. 'Generate a paid receipt for John Doe for 50 hours of plumbing at $40/hr'"
               className="flex-1 bg-transparent border-none outline-none text-foreground font-medium placeholder:text-muted-foreground/50 text-sm"
               value={aiPrompt}
               onChange={(e) => setAiPrompt(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleAiAssist()}
             />
             <button 
               onClick={handleAiAssist}
               disabled={!aiPrompt || isAiLoading}
               className="bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-full hover:bg-blue-600 transition-all disabled:opacity-50 disabled:hover:bg-blue-500 flex items-center gap-2 shrink-0"
             >
               {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4" /> Auto-Fill</>}
             </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* Client Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={t.card + " p-8"}>
              <div className="flex items-center gap-4 mb-8 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <h2 className={t.h3}>Client Information</h2>
                  <p className={t.muted}>Who is this receipt for?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 relative">
                  <label className={t.label + " mb-3 block"}>Client Name *</label>
                  <input 
                    type="text" 
                    className={t.input} 
                    placeholder="e.g. Acme Corp" 
                    required 
                    value={formData.clientName} 
                    onChange={e => {
                      setFormData({...formData, clientName: e.target.value});
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  />
                  <AnimatePresence>
                    {showClientDropdown && filteredClients.length > 0 && (
                      <motion.div 
                        key="client-dropdown"
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 5 }} 
                        className="absolute z-50 left-0 right-0 top-[100%] mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                      >
                        {filteredClients.map((client: any, idx: number) => (
                          <div 
                            key={idx} 
                            onClick={() => handleSelectClient(client)}
                            className="p-4 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0 flex flex-col gap-1"
                          >
                            <p className="font-bold text-foreground">{client.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[client.email, client.phone].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <label className={t.label + " mb-3 block"}>Email Address</label>
                  <input type="email" className={t.input} placeholder="client@example.com" value={formData.clientEmail} onChange={e => setFormData({...formData, clientEmail: e.target.value})} />
                </div>
                <div>
                  <label className={t.label + " mb-3 block"}>Phone Number</label>
                  <input type="text" className={t.input} placeholder="+1 234 567 890" value={formData.clientPhone} onChange={e => setFormData({...formData, clientPhone: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className={t.label + " mb-3 block"}>Billing Address</label>
                  <textarea className={t.textarea} rows={2} placeholder="123 Builder St, Construction City" value={formData.clientAddress} onChange={e => setFormData({...formData, clientAddress: e.target.value})} />
                </div>
              </div>
            </motion.div>

            {/* Line Items */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={t.card + " p-8 overflow-hidden"}>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ReceiptIcon size={24} />
                  </div>
                  <div>
                    <h2 className={t.h3}>Line Items</h2>
                    <p className={t.muted}>What are they paying for?</p>
                  </div>
                </div>
                <button type="button" onClick={addItem} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-background border border-border text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors">
                  <Plus size={16} /> Add Row
                </button>
              </div>

              {/* Table Headers */}
              <div className="flex gap-4 px-2 mb-4">
                <div className="flex-1"><label className={t.label}>Description</label></div>
                <div className="w-24"><label className={t.label}>Quantity</label></div>
                <div className="w-32"><label className={t.label}>Rate</label></div>
                <div className="w-32"><label className={t.label}>Amount</label></div>
                {items.length > 1 && <div className="w-12"></div>}
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      className="flex gap-4 items-start bg-muted/30 p-3 rounded-2xl border border-border/50 group"
                    >
                      <div className="flex-1">
                        <input type="text" placeholder="Service or product description" className={t.input + " bg-background"} value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
                      </div>
                      <div className="w-24">
                        <input type="number" min="1" className={t.input + " bg-background text-center"} value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} />
                      </div>
                      <div className="w-32">
                        <input type="number" min="0" className={t.input + " bg-background"} value={item.rate || ''} placeholder="0.00" onChange={e => handleItemChange(index, 'rate', Number(e.target.value))} />
                      </div>
                      <div className="w-32">
                        <div className="w-full h-[54px] flex items-center px-4 bg-background border border-transparent rounded-2xl text-foreground font-black tracking-tight">
                          {item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      {items.length > 1 && (
                        <div className="w-12 pt-1">
                          <button type="button" onClick={() => removeItem(index)} className="w-10 h-10 flex items-center justify-center text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-6 pt-6 border-t border-border flex justify-end">
                 <button type="button" onClick={addItem} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-primary bg-primary/10 text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-colors">
                  <Plus size={16} /> Add Another Row
                 </button>
              </div>
            </motion.div>

          </div>

          {/* Sticky Summary Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="sticky top-8 space-y-6">
            
            <div className={t.card + " p-8"}>
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <h2 className={t.h3}>Summary</h2>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm font-bold text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{company?.currency || 'USD'} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm font-bold text-muted-foreground">
                    <span>Tax ({taxRate}%)</span>
                    <span>{company?.currency || 'USD'} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t border-border mt-4">
                  <span className="text-sm font-black uppercase tracking-widest text-foreground">Total Due</span>
                  <span className="text-3xl font-black text-foreground tracking-tight">{company?.currency || 'USD'} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={t.label + " mb-2 block"}>Status</label>
                  <select className={t.select} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending Payment</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className={t.label + " mb-2 block"}>Payment Method</label>
                  <select className={t.select} value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                    <option value="">Select method...</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className={t.label + " mb-2 block"}>Internal Notes</label>
                  <textarea className={t.textarea} rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Thank you for your business." />
                </div>
              </div>

              <button 
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !formData.clientName}
                className={`w-full mt-8 flex items-center justify-center gap-3 ${t.btnPrimary} h-[60px] text-sm shadow-xl disabled:opacity-50`}
              >
                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Generate Receipt
              </button>
            </div>

          </motion.div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && createdReceiptId && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className={t.overlay}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className={t.modal}
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Save size={40} />
                </div>
                <h2 className={t.h2 + " mb-2"}>Receipt Created!</h2>
                <p className={t.muted}>Your receipt is ready. What would you like to do next?</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => navigate(`/dashboard/receipts/${createdReceiptId}`)}
                  className={`w-full ${t.btnPrimary} flex items-center justify-center gap-3`}
                >
                  <ReceiptIcon size={18} /> View Receipt Details
                </button>
                <button 
                  onClick={() => navigate(`/dashboard/receipts/${createdReceiptId}`)}
                  className={`w-full ${t.btnSecondary} flex items-center justify-center gap-3`}
                >
                  Download PDF
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => navigate(`/dashboard/receipts/${createdReceiptId}`)}
                    className={`w-full ${t.btnSecondary} flex items-center justify-center gap-2`}
                  >
                    Send Email
                  </button>
                  <button 
                    onClick={() => navigate(`/dashboard/receipts/${createdReceiptId}`)}
                    className={`w-full ${t.btnSecondary} flex items-center justify-center gap-2`}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  setFormData({ clientName: '', clientEmail: '', clientPhone: '', clientAddress: '', status: 'draft', notes: '', paymentMethod: '' });
                  setItems([{ description: '', quantity: 1, rate: 0, total: 0 }]);
                }}
                className="w-full mt-6 text-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
              >
                Create Another Receipt
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </DashboardShell>
  );
}
