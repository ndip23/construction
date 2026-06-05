import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../api/client';
import { 
  Plus, 
  Trash2, 
  Send, 
  ChevronLeft,
  Settings,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InvoiceEditor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore(); // Pulling your real company branding

  const { data: company } = useQuery({
    queryKey: ['my-company'],
    queryFn: async () => (await apiClient.get('/auth/company/profile')).data
  });

  // 1. STATE FOR DYNAMIC DATA
  const [items, setItems] = useState([
    { id: Date.now(), desc: '', qty: 1, rate: 0 },
  ]);

  const [client, setClient] = useState({
    name: '',
    address: '',
    email: ''
  });

  // 2. REAL-TIME CALCULATIONS
  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + tax;

  // 3. BACKEND INTEGRATION (Save to MongoDB)
  const createInvoiceMutation = useMutation({
    mutationFn: (invoiceData: any) => apiClient.post('/invoices', invoiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      navigate('/dashboard/finance'); // Go back to finance hub after saving
    }
  });

  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: '', qty: 1, rate: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSave = () => {
    if (!client.name) return alert("Please enter a client name.");
    
    createInvoiceMutation.mutate({
      client,
      items: items.map(({ desc, qty, rate }) => ({ description: desc, quantity: qty, rate, total: qty * rate })),
      subtotal,
      totalAmount: total,
      status: 'Pending'
    });
  };

  return (
    <DashboardShell>
      <motion.div layout className="max-w-[1400px] mx-auto min-h-0 flex flex-col">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 shrink-0">
          <motion.div layout className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-card rounded-full transition-colors text-muted-foreground">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate">Generate Document</h1>
          </motion.div>
          <motion.div layout className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
             <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl font-bold text-muted-foreground text-xs hover:bg-muted transition-all">
                <Settings size={16} /> Branding
             </button>
             <button 
                onClick={handleSave}
                disabled={createInvoiceMutation.isPending}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-primary text-brand-navy rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-yellow hover:bg-primary-dim transition-all"
             >
                {createInvoiceMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {createInvoiceMutation.isPending ? 'Saving...' : 'Issue Invoice'}
             </button>
          </motion.div>
        </header>

        <motion.div layout className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-hidden min-h-0">
          
          {/* LEFT: DATA ENTRY */}
          <section className="w-full lg:w-1/2 overflow-y-auto lg:pr-4 custom-scrollbar pb-6 lg:pb-10 max-h-[50vh] lg:max-h-none">
            <div className="space-y-6">
              {/* CLIENT DETAILS */}
              <div className="bg-card border border-border p-8 rounded-[2.5rem] border border-border shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 px-1">Recipient Information</h3>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Client or Project Name"
                    className="w-full bg-muted border-none rounded-2xl py-4 px-6 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/40 outline-none"
                    value={client.name}
                    onChange={(e) => setClient({...client, name: e.target.value})}
                  />
                  <input 
                    type="text" 
                    placeholder="Billing Address"
                    className="w-full bg-muted border-none rounded-2xl py-4 px-6 text-sm text-foreground/70 focus:ring-2 focus:ring-primary/40 outline-none"
                    value={client.address}
                    onChange={(e) => setClient({...client, address: e.target.value})}
                  />
                </div>
              </div>

              {/* LINE ITEMS */}
              <div className="bg-card border border-border p-8 rounded-[2.5rem] border border-border shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 px-1">Invoice Line Items</h3>
                <div className="space-y-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <input 
                          type="text" 
                          placeholder="Description"
                          className="flex-[3] bg-muted border-none rounded-2xl py-4 px-6 text-xs font-medium text-foreground outline-none"
                          value={item.desc}
                          onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                        />
                        <input 
                          type="number" 
                          placeholder="Qty"
                          className="flex-1 bg-muted border-none rounded-2xl py-4 px-2 text-xs font-black text-foreground outline-none text-center"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                        />
                        <input 
                          type="number" 
                          placeholder="Rate"
                          className="flex-[1.5] bg-muted border-none rounded-2xl py-4 px-2 text-xs font-black text-foreground outline-none text-center"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseInt(e.target.value) || 0)}
                        />
                        <button onClick={() => removeItem(item.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground font-bold text-[10px] uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                    <Plus size={14} /> Add Line Item
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: LIVE PREVIEW (THE A4 CANVAS) */}
          <section className="w-full lg:w-1/2 bg-background rounded-2xl sm:rounded-[3rem] p-4 sm:p-10 flex justify-center overflow-x-auto overflow-y-auto custom-scrollbar shadow-inner min-h-[320px] lg:min-h-0">
            <motion.div layout className="w-full max-w-[595px] min-h-[600px] sm:min-h-[842px] bg-card shadow-2xl p-6 sm:p-14 flex flex-col shrink-0">
              
              {/* CUSTOMER INFORMATION AT THE TOP */}
              <div className="mb-10 border-b border-border pb-6 bg-muted/20 p-6 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50 mb-2">Billed to (Customer)</p>
                <h4 className="font-black text-foreground text-lg uppercase">{client.name || 'Recipient Name'}</h4>
                <p className="text-xs text-brand-muted leading-relaxed mt-1">{client.address || 'Recipient Address'}</p>
              </div>

              {/* AUTOMATIC BRANDING FROM AUTH STORE & COMPANY */}
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    {company?.logo ? (
                      <img src={company.logo} alt={company.name} className="h-12 w-auto object-contain rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center text-foreground font-black text-xl italic">
                        {user?.company?.charAt(0) || 'B'}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-black text-foreground">{user?.company || 'My Company'}</h2>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter italic mt-0.5">BuildHub Premium Member</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-5xl font-light text-foreground/15 uppercase tracking-tighter mb-4">Invoice</h1>
                  <p className="text-sm font-black text-foreground">#DRAFT-{new Date().getFullYear()}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <table className="w-full mb-12">
                <thead>
                  <tr className="border-b-2 border-border text-[9px] uppercase font-black text-foreground">
                    <th className="py-4 text-left">Item Description</th>
                    <th className="py-4 text-center">Qty</th>
                    <th className="py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 text-xs font-bold text-foreground/90">{item.desc || 'Untitled Service'}</td>
                      <td className="py-4 text-xs font-medium text-muted-foreground text-center">{item.qty}</td>
                      <td className="py-4 text-xs font-black text-foreground text-right">${(item.qty * item.rate).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-auto flex justify-end">
                <div className="w-56 space-y-3 pt-6 border-t-4 border-border">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-foreground">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Tax (15%)</span>
                    <span className="text-foreground">${tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xl pt-4 border-t border-border">
                    <span className="font-black text-foreground uppercase text-xs mt-1.5 tracking-tighter">Total Amount</span>
                    <span className="font-black text-primary">${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <motion.div layout className="mt-20 pt-10 border-t border-border text-center">
                <p className="text-[9px] text-foreground/35 font-bold uppercase tracking-[0.3em]">BuildHub Digital Document • Securing African Infrastructure</p>
              </motion.div>
            </motion.div>
          </section>

        </motion.div>
      </motion.div>
    </DashboardShell>
  );
};

export default InvoiceEditor;