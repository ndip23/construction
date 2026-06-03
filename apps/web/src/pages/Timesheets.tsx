import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { useCurrencyStore } from '../store/useCurrencyStore';
import {
  FileClock, Clock, Timer, CalendarDays, Wallet, Loader2, Inbox, Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { t } from '../theme';

interface TimesheetEntry {
  _id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  hours?: number;
  overtimeHours?: number;
  project?: { name?: string };
}

interface TimesheetResult {
  totalHours: number;
  totalOvertime: number;
  days: number;
  entries: TimesheetEntry[];
}

const fmtTime = (d?: string) =>
  d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const Timesheets = () => {
  const { fromUSD, format } = useCurrencyStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  const [worker, setWorker] = useState('');
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(isoDaysAgo(0));

  const { data: workers } = useQuery<any[]>({
    queryKey: ['workforce-list'],
    queryFn: async () => (await apiClient.get('/workforce')).data,
  });

  const selectedWorker = useMemo(
    () => (workers || []).find((w) => w._id === worker),
    [workers, worker]
  );

  const { data, isFetching, refetch, isError } = useQuery<TimesheetResult>({
    queryKey: ['timesheet', worker, from, to],
    queryFn: async () =>
      (await apiClient.get(`/attendance/timesheet?worker=${worker}&from=${from}&to=${to}`)).data,
    enabled: false,
  });

  const run = () => { if (worker) refetch(); };

  // estimated pay: hourly → hours*rate; daily/monthly → days*rate as a friendly estimate
  const estPay = useMemo(() => {
    if (!data || !selectedWorker) return null;
    const rate = selectedWorker.payRate || 0;
    if (selectedWorker.payType === 'hourly') return data.totalHours * rate;
    if (selectedWorker.payType === 'daily') return data.days * rate;
    return null; // monthly — not meaningful per-range
  }, [data, selectedWorker]);

  const KPIS = data ? [
    { label: 'Total Hours', value: `${data.totalHours}h`, icon: <Clock size={22} />, box: t.iconBoxNavy },
    { label: 'Overtime', value: `${data.totalOvertime}h`, icon: <Timer size={22} />, box: t.iconBoxYellow },
    { label: 'Days Worked', value: data.days, icon: <CalendarDays size={22} />, box: t.iconBoxGreen },
    { label: 'Est. Pay', value: estPay != null ? money(estPay) : '—', icon: <Wallet size={22} />, box: t.iconBoxNavy },
  ] : [];

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        <header className={t.pageHeader}>
          <div>
            <h1 className={`${t.h2} italic`}>Timesheets</h1>
            <p className={t.muted}>Aggregate worked hours and overtime over any date range.</p>
          </div>
        </header>

        <div className={`${t.cardLg} p-7 mb-10`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className={t.label + ' block mb-1 px-1'}>Worker</label>
              <select value={worker} onChange={(e) => setWorker(e.target.value)} className={t.select}>
                <option value="">Select worker…</option>
                {(workers || []).map((w) => (
                  <option key={w._id} value={w._id}>{w.name} · {w.role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={t.label + ' block mb-1 px-1'}>From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={t.input} />
            </div>
            <div>
              <label className={t.label + ' block mb-1 px-1'}>To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={t.input} />
            </div>
          </div>
          <button
            onClick={run}
            disabled={!worker || isFetching}
            className={t.btnPrimary + ' mt-4 flex items-center gap-2 disabled:opacity-50'}
          >
            {isFetching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            Generate Timesheet
          </button>
        </div>

        {isError && (
          <div className={`${t.card} p-6 text-center mb-8`}>
            <p className={t.muted}>Could not load timesheet. Try again.</p>
          </div>
        )}

        {!data ? (
          <div className={t.emptyState}>
            <FileClock className="mx-auto text-foreground/15 mb-4" size={56} />
            <h3 className="text-lg font-bold text-muted-foreground">Pick a worker and range to generate a timesheet</h3>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {KPIS.map((k) => (
                <div key={k.label} className={`${t.statCard} flex items-center justify-between`}>
                  <div>
                    <p className={t.label + ' mb-1'}>{k.label}</p>
                    <h3 className="text-2xl md:text-3xl font-black text-foreground italic">{k.value}</h3>
                  </div>
                  <div className={k.box}>{k.icon}</div>
                </div>
              ))}
            </div>

            {data.entries.length === 0 ? (
              <div className={t.emptyState}>
                <Inbox className="mx-auto text-foreground/15 mb-4" size={56} />
                <h3 className="text-lg font-bold text-muted-foreground">No completed entries in this range</h3>
              </div>
            ) : (
              <div className={`${t.cardLg} overflow-hidden`}>
                <table className="w-full">
                  <thead>
                    <tr className={t.tableHead}>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">In</th>
                      <th className="px-6 py-4 text-left">Out</th>
                      <th className="px-6 py-4 text-left">Project</th>
                      <th className="px-6 py-4 text-left">Hours</th>
                      <th className="px-6 py-4 text-left">Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((e) => (
                      <motion.tr
                        key={e._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={t.tableRow}
                      >
                        <td className="px-6 py-5 text-sm font-black text-foreground">{e.date}</td>
                        <td className="px-6 py-5 text-sm font-bold text-foreground/80">{fmtTime(e.clockIn)}</td>
                        <td className="px-6 py-5 text-sm font-bold text-foreground/80">{fmtTime(e.clockOut)}</td>
                        <td className="px-6 py-5 text-sm font-medium text-muted-foreground">{e.project?.name || '—'}</td>
                        <td className="px-6 py-5 text-sm font-black text-foreground">{e.hours ?? 0}h</td>
                        <td className="px-6 py-5">
                          {(e.overtimeHours || 0) > 0 ? (
                            <span className={`${t.badgeAmber} inline-flex items-center gap-1`}>
                              <Timer size={10} /> {e.overtimeHours}h
                            </span>
                          ) : (
                            <span className={t.micro + ' text-muted-foreground'}>—</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default Timesheets;
