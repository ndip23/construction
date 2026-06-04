import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../../components/layout/DashboardShell';
import apiClient from '../../api/client';
import { t, statusBadge } from '../../theme';
import { exportToCSV } from '../../utils/exporters';
import {
  Loader2,
  Inbox,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bucket {
  count: number;
  total: number;
}

interface RecentInvoice {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  currency?: string;
  company: { name: string; slug: string };
}

interface Finance {
  summary: {
    Paid: Bucket;
    Pending: Bucket;
    Overdue: Bucket;
  };
  recent: RecentInvoice[];
}

const SuperAdminFinance = () => {
  const { data, isLoading } = useQuery<Finance>({
    queryKey: ['sa-finance'],
    queryFn: async () => (await apiClient.get('/superadmin/finance')).data,
  });

  const handleExport = () => {
    const rows = (data?.recent ?? []).map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      company: inv.company?.name || '',
      totalAmount: inv.totalAmount ?? 0,
      status: inv.status,
      date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '',
    }));
    exportToCSV(`buildhub-invoices-${Date.now()}`, rows, [
      { key: 'invoiceNumber', label: 'Invoice Number' },
      { key: 'company', label: 'Company' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'status', label: 'Status' },
      { key: 'date', label: 'Date' },
    ]);
  };

  const cards = [
    {
      key: 'Paid' as const,
      i: CheckCircle2,
      bg: 'bg-emerald-500',
      label: 'Paid',
    },
    {
      key: 'Pending' as const,
      i: Clock,
      bg: 'bg-amber-500',
      label: 'Pending',
    },
    {
      key: 'Overdue' as const,
      i: AlertTriangle,
      bg: 'bg-rose-500',
      label: 'Overdue',
    },
  ];

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className={t.iconBoxNavy}>
                <Receipt size={20} />
              </div>
              <h1 className={t.h2}>Finance</h1>
            </div>
            <p className={t.muted}>Platform-wide invoice totals (raw figures, no FX conversion).</p>
          </div>
          <button
            onClick={handleExport}
            className={`${t.btnSecondary} flex items-center gap-2 self-start md:self-auto`}
          >
            <Download size={15} />
            Export CSV
          </button>
        </header>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {cards.map((c) => {
            const bucket = data?.summary?.[c.key];
            return (
              <div
                key={c.key}
                className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-card transition-all"
              >
                <div
                  className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <c.i size={24} />
                </div>
                <p className={`${t.label} mb-1`}>{c.label}</p>
                <h3 className="text-2xl font-black text-foreground tracking-tighter">
                  {isLoading ? (
                    <Loader2 className="animate-spin text-foreground/15" />
                  ) : (
                    (bucket?.total ?? 0).toLocaleString()
                  )}
                </h3>
                <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase tracking-tight">
                  {bucket?.count ?? 0} invoice{(bucket?.count ?? 0) === 1 ? '' : 's'}
                </p>
              </div>
            );
          })}
        </div>

        {/* RECENT INVOICES */}
        <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
          Recent Invoices
        </h2>
        <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[680px]">
              <thead className={`${t.tableHead} border-b border-border`}>
                <tr>
                  <th className="px-6 py-5">Invoice</th>
                  <th className="px-6 py-5">Company</th>
                  <th className="px-6 py-5">Amount</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                          Loading invoices...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : !data?.recent || data.recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <Inbox className="mx-auto text-muted-foreground/30 mb-4" size={56} />
                      <h3 className="text-lg font-black text-muted-foreground">No recent invoices</h3>
                      <p className="text-sm text-foreground/40 mt-1">
                        Invoices will appear here as companies bill.
                      </p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {data.recent.map((inv) => (
                      <motion.tr
                        key={inv._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={t.tableRow}
                      >
                        <td className="px-6 py-5">
                          <p className="text-foreground font-black text-sm">
                            {inv.invoiceNumber}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-foreground/90 font-bold text-xs truncate max-w-[200px]">
                            {inv.company?.name || '—'}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-foreground font-black text-sm">
                            {inv.totalAmount?.toLocaleString() ?? '0'}
                            {inv.currency && (
                              <span className="text-[10px] text-muted-foreground font-bold ml-1">
                                {inv.currency}
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={statusBadge(inv.status)}>{inv.status}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="text-xs font-bold text-muted-foreground">
                            {inv.createdAt
                              ? new Date(inv.createdAt).toLocaleDateString()
                              : '—'}
                          </p>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default SuperAdminFinance;
