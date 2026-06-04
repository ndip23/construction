import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../api/client';
import { Plus, Receipt, Search, Download, MessageCircle, Filter, ArrowRight } from 'lucide-react';
import { t, statusBadge } from '../theme';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Receipts() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts', user?.companyId],
    queryFn: async () => {
      const { data } = await apiClient.get('/receipts');
      return data;
    },
    enabled: !!user?.companyId,
  });

  const handleWhatsApp = (receipt: any) => {
    const text = `Hello ${receipt.client?.name || 'Customer'},\n\nHere is your receipt ${receipt.receiptNumber} for ${receipt.currency} ${receipt.totalAmount.toLocaleString()}.\n\nThank you for your business!`;
    const url = `https://wa.me/${receipt.client?.phone?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp opened!');
  };

  const filteredReceipts = receipts?.filter((r: any) => 
    (r.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-border pb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Financial Module</span>
            </div>
            <h1 className={t.h1}>Smart Receipts</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">
              Generate, Track, and Manage Digital Receipts
            </p>
          </div>
          <Link 
            to="/dashboard/receipts/new" 
            className="bg-primary text-brand-navy hover:bg-primary-dim transition-all shadow-yellow px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Plus size={18} /> New Receipt
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 mb-8 ${t.card}`}>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by client name or receipt number..." 
                className={`${t.input} pl-12`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className={`${t.btnSecondary} flex items-center gap-2 shrink-0 h-[52px]`}>
              <Filter size={16} /> Filter
            </button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className={`h-48 animate-pulse bg-muted ${t.card}`} />
             ))}
          </div>
        ) : filteredReceipts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={t.emptyState}>
            <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 text-primary rounded-full flex items-center justify-center">
               <Receipt size={48} />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">No Receipts Found</h3>
            <p className={t.muted + " max-w-md mx-auto mb-8"}>You haven't generated any receipts yet or no receipts match your search criteria. Create one to get started.</p>
            <Link to="/dashboard/receipts/new" className={t.btnPrimary + " inline-flex items-center gap-2"}>
              <Plus size={18} /> Generate First Receipt
            </Link>
          </motion.div>
        ) : (
          <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className={t.tableHead + " px-8 py-5"}>Receipt #</th>
                  <th className={t.tableHead + " px-8 py-5"}>Client</th>
                  <th className={t.tableHead + " px-8 py-5"}>Date</th>
                  <th className={t.tableHead + " px-8 py-5"}>Amount</th>
                  <th className={t.tableHead + " px-8 py-5"}>Status</th>
                  <th className={t.tableHead + " px-8 py-5 text-right"}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {filteredReceipts.map((receipt: any, index: number) => (
                    <motion.tr 
                      key={receipt._id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={t.tableRow}
                    >
                      <td className={t.tableCell + " px-8"}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-foreground font-black text-xs">
                             <Receipt size={16} />
                          </div>
                          <span className="font-black text-foreground tracking-tight">{receipt.receiptNumber}</span>
                        </div>
                      </td>
                      <td className={t.tableCell + " px-8"}>
                        <p className="font-bold text-foreground">{receipt.client?.name || 'Unknown Client'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{receipt.client?.email || receipt.client?.phone || 'No contact info'}</p>
                      </td>
                      <td className={t.tableCell + " px-8"}>
                        <p className="font-medium text-foreground">{new Date(receipt.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </td>
                      <td className={t.tableCell + " px-8"}>
                        <p className="font-black text-foreground tracking-tight text-lg">{receipt.currency} {receipt.totalAmount?.toLocaleString()}</p>
                      </td>
                      <td className={t.tableCell + " px-8"}>
                        <span className={statusBadge(receipt.status)}>
                          {receipt.status}
                        </span>
                      </td>
                      <td className={t.tableCell + " px-8 text-right"}>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleWhatsApp(receipt)}
                            className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 flex items-center justify-center transition-colors group relative"
                          >
                            <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap">WhatsApp</span>
                          </button>
                          
                          <button 
                            onClick={() => navigate(`/dashboard/receipts/${receipt._id}`)}
                            className="w-10 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors group relative"
                          >
                            <Download size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap">PDF</span>
                          </button>

                          <button 
                            onClick={() => navigate(`/dashboard/receipts/${receipt._id}`)}
                            className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-xl bg-background border border-border hover:bg-muted text-foreground transition-colors font-black text-[10px] uppercase tracking-widest ml-2"
                          >
                            View <ArrowRight size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
