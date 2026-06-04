import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import { ReceiptPreview } from '../components/ReceiptPreview';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, Printer, MessageCircle, Trash2, Mail, Loader2 } from 'lucide-react';
import { t } from '../theme';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: receipt, isLoading: isReceiptLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/receipts/${id}`);
      return data;
    },
    enabled: !!id
  });

  const { data: company, isLoading: isCompanyLoading } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/company/profile');
      return data;
    },
    enabled: !!user?.companyId
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/receipts/${id}`);
    },
    onSuccess: () => {
      toast.success('Receipt deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      navigate('/dashboard/receipts');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete')
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/receipts/${id}/email`);
    },
    onSuccess: () => {
      toast.success('Receipt emailed successfully!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to send email')
  });

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!receipt || !company) return;
    const text = `Hello ${receipt.client?.name || 'Customer'},\n\nHere is your receipt ${receipt.receiptNumber} for ${receipt.currency} ${receipt.totalAmount.toLocaleString()}.\n\nThank you for your business!`;
    const url = `https://wa.me/${receipt.client?.phone?.replace(/[^0-9]/g, '') || ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp opened!');
  };

  if (isReceiptLoading || isCompanyLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (!receipt) {
    return (
      <DashboardShell>
        <div className={t.emptyState}>
          <h3 className={t.h3}>Receipt Not Found</h3>
          <p className={t.muted}>This receipt may have been deleted or does not exist.</p>
          <button onClick={() => navigate('/dashboard/receipts')} className={t.btnPrimary + " mt-6"}>Back to Receipts</button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
          }
          #receipt-preview, #receipt-preview * {
            visibility: visible;
          }
          #receipt-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      
      <div className="max-w-[1200px] mx-auto pb-24">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 pb-8 border-b border-border">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard/receipts')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-card border border-border hover:bg-muted transition-all group shrink-0">
              <ArrowLeft className="w-5 h-5 text-foreground group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Receipt Detail</span>
              </div>
              <h1 className={t.h2}>{receipt.receiptNumber}</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => deleteMutation.mutate()} 
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-black text-[10px] uppercase tracking-widest transition-colors"
            >
              <Trash2 size={16} /> Delete
            </button>
            
            <button 
              onClick={() => emailMutation.mutate()} 
              disabled={emailMutation.isPending} 
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-background border border-border hover:bg-muted text-foreground font-black text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {emailMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Email
            </button>
            
            <button 
              onClick={handleWhatsApp} 
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-black text-[10px] uppercase tracking-widest transition-colors"
            >
              <MessageCircle size={16} /> WhatsApp
            </button>
            
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-brand-navy hover:bg-primary-dim font-black text-xs uppercase tracking-widest transition-colors shadow-yellow"
            >
              <Printer size={16} /> Print / PDF
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center">
          <div className="w-full max-w-[800px] overflow-hidden rounded-[3rem] shadow-2xl bg-card border border-border">
            <ReceiptPreview receipt={receipt} company={company} />
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
