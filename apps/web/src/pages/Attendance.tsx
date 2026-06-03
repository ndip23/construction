import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import {
  CalendarClock, MapPin, LogIn, Loader2, Inbox, Clock, Timer, CheckCircle2, Radio,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { t, statusBadge } from '../theme';

interface AttendanceRow {
  _id: string;
  worker?: { _id: string; name: string; role: string };
  project?: { _id: string; name: string };
  date: string;
  clockIn?: string;
  clockOut?: string;
  hours?: number;
  overtimeHours?: number;
  status: 'active' | 'completed';
}

const fmtTime = (d?: string) =>
  d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const todayStr = () => new Date().toISOString().slice(0, 10);

const Attendance = () => {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [selWorker, setSelWorker] = useState('');
  const [selProject, setSelProject] = useState('');

  const { data: workers } = useQuery<any[]>({
    queryKey: ['workforce-list'],
    queryFn: async () => (await apiClient.get('/workforce')).data,
  });

  const { data: projects } = useQuery<any[]>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
  });

  const { data: log, isLoading } = useQuery<AttendanceRow[]>({
    queryKey: ['attendance', dateFilter],
    queryFn: async () => (await apiClient.get(`/attendance?date=${dateFilter}`)).data,
  });

  const { data: onSite } = useQuery<AttendanceRow[]>({
    queryKey: ['attendance-today', todayStr()],
    queryFn: async () => (await apiClient.get(`/attendance?date=${todayStr()}`)).data,
  });

  const clockInMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/attendance/clock-in', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      setSelWorker('');
      setSelProject('');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: (workerId: string) => apiClient.post('/attendance/clock-out', { workerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
    },
  });

  const active = (onSite || []).filter((r) => r.status === 'active');

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20">
        <header className={t.pageHeader}>
          <div>
            <h1 className={`${t.h2} italic`}>Attendance</h1>
            <p className={t.muted}>Live site presence, clock-ins and the daily log.</p>
          </div>
        </header>

        {/* Manual clock-in control */}
        <div className={`${t.cardLg} p-7 mb-10`}>
          <p className={t.label + ' mb-4 flex items-center gap-2'}>
            <LogIn size={13} /> Clock in a worker
          </p>
          <div className="flex flex-col md:flex-row gap-3">
            <select value={selWorker} onChange={(e) => setSelWorker(e.target.value)} className={t.select + ' md:flex-1'}>
              <option value="">Select worker…</option>
              {(workers || []).map((w) => (
                <option key={w._id} value={w._id}>{w.name} · {w.role}</option>
              ))}
            </select>
            <select value={selProject} onChange={(e) => setSelProject(e.target.value)} className={t.select + ' md:flex-1'}>
              <option value="">No project</option>
              {(projects || []).map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={() => clockInMutation.mutate({ workerId: selWorker, projectId: selProject || undefined })}
              disabled={!selWorker || clockInMutation.isPending}
              className={t.btnPrimary + ' flex items-center justify-center gap-2 disabled:opacity-50'}
            >
              {clockInMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
              Clock In
            </button>
          </div>
        </div>

        {/* Who's on site now */}
        <section className="mb-12">
          <h2 className={`${t.label} mb-5 flex items-center gap-2`}>
            <Radio size={13} className="text-emerald-400" /> On site now · {active.length}
          </h2>
          {active.length === 0 ? (
            <div className={`${t.card} p-8 text-center`}>
              <p className={t.muted}>Nobody is clocked in right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {active.map((r) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${t.cardLg} p-6`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-black text-foreground">{r.worker?.name || 'Worker'}</h3>
                      <p className={t.micro + ' text-muted-foreground'}>{r.worker?.role}</p>
                    </div>
                    <span className={`${t.badgeGreen} flex items-center gap-1`}>
                      <Radio size={10} /> Live
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/70 mb-2">
                    <Clock size={14} className="text-primary" /> In at {fmtTime(r.clockIn)}
                  </div>
                  {r.project?.name && (
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-5">
                      <MapPin size={14} className="text-primary" /> {r.project.name}
                    </div>
                  )}
                  <button
                    onClick={() => r.worker?._id && clockOutMutation.mutate(r.worker._id)}
                    disabled={clockOutMutation.isPending}
                    className={t.btnSecondary + ' w-full flex items-center justify-center gap-2 disabled:opacity-50'}
                  >
                    <CheckCircle2 size={15} /> Clock Out
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Daily log */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className={`${t.label} flex items-center gap-2`}>
              <CalendarClock size={13} /> Attendance log
            </h2>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={t.input + ' w-auto py-2.5'}
            />
          </div>

          {isLoading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={36} /></div>
          ) : (log || []).length === 0 ? (
            <div className={t.emptyState}>
              <Inbox className="mx-auto text-foreground/15 mb-4" size={56} />
              <h3 className="text-lg font-bold text-muted-foreground">No attendance for this date</h3>
            </div>
          ) : (
            <div className={`${t.cardLg} overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className={t.tableHead}>
                    <th className="px-6 py-4 text-left">Worker</th>
                    <th className="px-6 py-4 text-left">In</th>
                    <th className="px-6 py-4 text-left">Out</th>
                    <th className="px-6 py-4 text-left">Hours</th>
                    <th className="px-6 py-4 text-left">Overtime</th>
                    <th className="px-6 py-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(log || []).map((r) => (
                    <tr key={r._id} className={t.tableRow}>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-foreground">{r.worker?.name || 'Worker'}</p>
                        <p className={t.micro + ' text-muted-foreground'}>{r.worker?.role}</p>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-foreground/80">{fmtTime(r.clockIn)}</td>
                      <td className="px-6 py-5 text-sm font-bold text-foreground/80">{fmtTime(r.clockOut)}</td>
                      <td className="px-6 py-5 text-sm font-black text-foreground">{r.hours ?? 0}h</td>
                      <td className="px-6 py-5">
                        {(r.overtimeHours || 0) > 0 ? (
                          <span className={`${t.badgeAmber} inline-flex items-center gap-1`}>
                            <Timer size={10} /> {r.overtimeHours}h OT
                          </span>
                        ) : (
                          <span className={t.micro + ' text-muted-foreground'}>—</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={statusBadge(r.status === 'completed' ? 'verified' : 'active')}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
};

export default Attendance;
