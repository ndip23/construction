import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Wallet, Play, Download, CheckCircle, Clock, Loader2, Users, BadgeDollarSign,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import apiClient from '../api/client';
import { DashboardShell } from '../components/layout/DashboardShell';
import { t } from '../theme';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

interface Payslip {
  _id: string;
  worker?: { _id: string; name: string; role: string } | null;
  periodFrom?: string;
  periodTo?: string;
  hoursWorked: number;
  overtimeHours: number;
  payType?: string;
  payRate?: number;
  gross: number;
  bonus: number;
  deduction: number;
  net: number;
  status: 'pending' | 'paid';
  paidAt?: string;
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const Payroll = () => {
  const queryClient = useQueryClient();
  const { fromUSD, format, currency } = useCurrencyStore();
  const { user } = useAuthStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  // PDF-safe money (currency code, not symbol — jsPDF font lacks ₦/GH₵ glyphs)
  const moneyPdf = (usd: number) =>
    `${Number(fromUSD(usd || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency.code}`;

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [periodFrom, setPeriodFrom] = useState(firstOfMonth);
  const [periodTo, setPeriodTo] = useState(today);

  const { data: payslips = [], isLoading } = useQuery<Payslip[]>({
    queryKey: ['payslips'],
    queryFn: async () => (await apiClient.get('/payroll')).data,
  });

  const runMutation = useMutation({
    mutationFn: async () =>
      (await apiClient.post('/payroll/run', { periodFrom, periodTo })).data,
    onSuccess: (data: any) => {
      toast.success(`${data.created} payslip${data.created === 1 ? '' : 's'} generated`);
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
    onError: () => toast.error('Failed to run payroll'),
  });

  const payMutation = useMutation({
    mutationFn: async (id: string) => (await apiClient.put(`/payroll/${id}/pay`)).data,
    onSuccess: () => {
      toast.success('Marked as paid');
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
    onError: () => toast.error('Failed to mark paid'),
  });

  // ── KPIs ───────────────────────────────────────────────────────────────
  const totalPayroll = payslips.reduce((sum, p) => sum + (p.net || 0), 0);
  const pendingCount = payslips.filter((p) => p.status === 'pending').length;
  const paidCount = payslips.filter((p) => p.status === 'paid').length;

  // ── Branded payslip PDF (navy/yellow) ────────────────────────────────────
  const downloadPayslip = (p: Payslip) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const marginX = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightX = pageWidth - marginX;
    const NAVY: [number, number, number] = [0, 21, 41];
    const YELLOW: [number, number, number] = [245, 197, 24];
    const company = user?.company || 'BuildHub';

    // Header band
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 96, 'F');
    doc.setFillColor(...YELLOW);
    doc.roundedRect(marginX, 30, 36, 36, 7, 7, 'F');
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('BH', marginX + 8, 54);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.text(company, marginX + 50, 48);
    doc.setTextColor(...YELLOW);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYSLIP', marginX + 50, 63);
    doc.setTextColor(200, 210, 220);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Generated  ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      rightX, 44, { align: 'right' }
    );
    doc.text(`Currency  ${currency.code}`, rightX, 57, { align: 'right' });
    doc.text(`Status  ${p.status.toUpperCase()}`, rightX, 70, { align: 'right' });

    // Worker + period block
    let y = 128;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('EMPLOYEE', marginX, y);
    doc.text('PERIOD', rightX - 200, y);
    y += 16;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(p.worker?.name || 'Worker', marginX, y);
    doc.setFontSize(10);
    doc.text(`${fmtDate(p.periodFrom)}  —  ${fmtDate(p.periodTo)}`, rightX - 200, y);
    y += 14;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text(p.worker?.role || '', marginX, y);
    doc.text(
      `${p.payType || ''}${p.payRate ? `  @ ${moneyPdf(p.payRate)}` : ''}`,
      rightX - 200, y
    );

    // Hours summary
    autoTable(doc, {
      startY: y + 22,
      head: [['Hours Worked', 'Overtime Hours']],
      body: [[String(p.hoursWorked || 0), String(p.overtimeHours || 0)]],
      styles: { fontSize: 10, cellPadding: 8, textColor: [30, 41, 59] },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: marginX, right: marginX },
    });

    // Earnings breakdown
    const afterHoursY = (doc as any).lastAutoTable?.finalY ?? y + 60;
    autoTable(doc, {
      startY: afterHoursY + 16,
      head: [['Earnings & Deductions', 'Amount']],
      body: [
        ['Gross', moneyPdf(p.gross)],
        ['Bonus', `+ ${moneyPdf(p.bonus)}`],
        ['Deduction', `- ${moneyPdf(p.deduction)}`],
      ],
      styles: { fontSize: 10, cellPadding: 8, textColor: [30, 41, 59] },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: marginX, right: marginX },
    });

    // Net pay bar
    const finalY = (doc as any).lastAutoTable?.finalY ?? afterHoursY + 60;
    let ny = finalY + 22;
    doc.setFillColor(...NAVY);
    doc.roundedRect(rightX - 260, ny, 260, 40, 6, 6, 'F');
    doc.setTextColor(...YELLOW);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('NET PAY', rightX - 246, ny + 25);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text(moneyPdf(p.net), rightX - 14, ny + 26, { align: 'right' });

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...YELLOW);
    doc.setLineWidth(2);
    doc.line(marginX, pageHeight - 40, marginX + 40, pageHeight - 40);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Generated by BuildHub — Construction Operating System', marginX, pageHeight - 26);

    const safeName = (p.worker?.name || 'worker').replace(/[^\w]+/g, '-').toLowerCase();
    doc.save(`payslip-${safeName}-${(p.periodTo || today).slice(0, 10)}.pdf`);
  };

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight italic">Payroll</h1>
            <p className="text-brand-muted text-sm font-medium">
              Run payroll from attendance and issue branded payslips.
            </p>
          </div>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className={t.statCard}>
            <div className="flex items-center justify-between">
              <span className={t.label}>Total Payroll (period)</span>
              <Wallet size={18} className="text-primary" />
            </div>
            <p className="text-3xl font-black text-foreground mt-3">{money(totalPayroll)}</p>
          </div>
          <div className={t.statCard}>
            <div className="flex items-center justify-between">
              <span className={t.label}>Pending</span>
              <Clock size={18} className="text-amber-400" />
            </div>
            <p className="text-3xl font-black text-foreground mt-3">{pendingCount}</p>
          </div>
          <div className={t.statCard}>
            <div className="flex items-center justify-between">
              <span className={t.label}>Paid</span>
              <CheckCircle size={18} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-foreground mt-3">{paidCount}</p>
          </div>
        </div>

        {/* Run Payroll panel */}
        <div className={`${t.cardLg} p-8 mb-8`}>
          <div className="flex items-center gap-2 mb-6">
            <div className={t.iconBoxYellow}>
              <BadgeDollarSign size={22} />
            </div>
            <div>
              <h3 className={t.h3}>Run Payroll</h3>
              <p className="text-xs text-muted-foreground font-medium">
                Aggregates completed attendance for every worker in the period.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className={`block mb-1.5 ${t.label}`}>Period from</label>
              <input
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className={t.input}
              />
            </div>
            <div>
              <label className={`block mb-1.5 ${t.label}`}>Period to</label>
              <input
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className={t.input}
              />
            </div>
            <button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending || !periodFrom || !periodTo}
              className={`flex items-center justify-center gap-2 ${t.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {runMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Run Payroll
            </button>
          </div>
        </div>

        {/* Payslips table */}
        <div className={`${t.cardLg} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={t.tableHead}>
                <tr>
                  <th className="px-6 py-5">Worker</th>
                  <th className="px-6 py-5">Period</th>
                  <th className="px-6 py-5">Hours</th>
                  <th className="px-6 py-5">Gross</th>
                  <th className="px-6 py-5">Net</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm font-bold text-muted-foreground">
                      <Loader2 className="inline animate-spin mr-2" size={16} /> Loading payslips…
                    </td>
                  </tr>
                ) : payslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm font-bold text-muted-foreground">
                      <Users className="inline mr-2" size={16} /> No payslips yet. Run payroll for a period above.
                    </td>
                  </tr>
                ) : (
                  payslips.map((p) => (
                    <motion.tr
                      key={p._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border hover:bg-muted/40 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-foreground">{p.worker?.name || '—'}</p>
                        <p className="text-[11px] font-bold text-muted-foreground">{p.worker?.role || ''}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-foreground/70">
                        {fmtDate(p.periodFrom)} — {fmtDate(p.periodTo)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground/80">
                        {p.hoursWorked || 0}
                        {p.overtimeHours ? (
                          <span className="text-[10px] font-black text-amber-500 ml-1">
                            +{p.overtimeHours} OT
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground/80">{money(p.gross)}</td>
                      <td className="px-6 py-4 text-sm font-black text-foreground">{money(p.net)}</td>
                      <td className="px-6 py-4">
                        <span className={p.status === 'paid' ? t.badgeGreen : t.badgeAmber}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => payMutation.mutate(p._id)}
                              disabled={payMutation.isPending}
                              className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                            >
                              <CheckCircle size={12} /> Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => downloadPayslip(p)}
                            className="flex items-center gap-1.5 bg-card border border-border text-foreground px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all"
                          >
                            <Download size={12} /> Payslip
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Payroll;
