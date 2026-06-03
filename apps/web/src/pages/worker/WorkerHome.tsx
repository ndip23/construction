import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import workerClient from '../../api/workerClient';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import {
  HardHat,
  LogOut,
  Clock,
  ListChecks,
  Timer,
  Wallet,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface WorkerProfile {
  id?: string;
  _id?: string;
  name?: string;
  role?: string;
}

interface TaskItem {
  _id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked' | string;
}

interface Timesheet {
  totalHours: number;
  totalOvertime: number;
  days: number;
}

interface Payslip {
  _id?: string;
  net?: number;
  netPay?: number;
  amount?: number;
  status?: string;
  period?: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const taskBadge = (status: string) => {
  switch (status) {
    case 'done':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'in-progress':
      return 'bg-primary/15 text-primary border-primary/30';
    case 'blocked':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default:
      return 'bg-white/10 text-white/60 border-white/20';
  }
};

const WorkerHome = () => {
  const navigate = useNavigate();
  const format = useCurrencyStore((s) => s.format);

  const [profile, setProfile] = useState<WorkerProfile>({});
  const [clockedIn, setClockedIn] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [weekSheet, setWeekSheet] = useState<Timesheet | null>(null);
  const [todaySheet, setTodaySheet] = useState<Timesheet | null>(null);
  const [payslip, setPayslip] = useState<Payslip | null>(null);

  const [loading, setLoading] = useState(true);

  // Guard: no token → back to login
  useEffect(() => {
    const stored = localStorage.getItem('workerProfile');
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    if (!localStorage.getItem('workerToken')) {
      navigate('/worker/login');
    }
  }, [navigate]);

  const signOut = () => {
    localStorage.removeItem('workerToken');    localStorage.removeItem('workerProfile');
    navigate('/worker/login');
  };

  // Load everything in parallel. Each card fails soft so one bad endpoint
  // doesn't blank the whole dashboard.
  useEffect(() => {
    const opts = { skipErrorToast: true } as any;
    const today = todayISO();

    const loadProfile = workerClient
      .get('/worker/me', opts)
      .then((r) => setProfile((p) => ({ ...p, ...r.data })))
      .catch(() => {});

    const loadTasks = workerClient
      .get('/tasks/mine', opts)
      .then((r) => setTasks(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTasks([]));

    const loadWeek = workerClient
      .get('/attendance/timesheet', opts)
      .then((r) => setWeekSheet(r.data))
      .catch(() => setWeekSheet(null));

    const loadToday = workerClient
      .get(`/attendance/timesheet?from=${today}&to=${today}`, opts)
      .then((r) => setTodaySheet(r.data))
      .catch(() => setTodaySheet(null));

    const loadPay = workerClient
      .get('/payroll', opts)
      .then((r) => {
        const data = r.data;
        const list = Array.isArray(data) ? data : data?.payslips || data?.data || [];
        setPayslip(list?.[0] || null);
      })
      .catch(() => setPayslip(null));

    Promise.allSettled([loadProfile, loadTasks, loadWeek, loadToday, loadPay]).finally(() =>
      setLoading(false)
    );
  }, []);

  const toggleClock = async () => {
    setClockLoading(true);
    try {
      if (!clockedIn) {
        await workerClient.post('/attendance/clock-in', {});
        setClockedIn(true);
      } else {
        await workerClient.post('/attendance/clock-out', {});
        setClockedIn(false);
        // Refresh today's hours after clocking out
        workerClient
          .get(`/attendance/timesheet?from=${todayISO()}&to=${todayISO()}`, { skipErrorToast: true } as any)
          .then((r) => setTodaySheet(r.data))
          .catch(() => {});
      }
    } catch {
      /* toast handled globally */
    } finally {
      setClockLoading(false);
    }
  };

  const payNet =
    payslip?.net ?? payslip?.netPay ?? payslip?.amount ?? null;
  const payStatus = payslip?.status || (payslip ? 'Pending' : null);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-brand-navy flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-navy text-white pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-brand-navy/90 backdrop-blur-md border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-brand-navy">
            <HardHat size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-black leading-tight">{profile.name || 'Worker'}</p>
            <p className="text-xs text-white/40 font-bold uppercase tracking-wider">
              {profile.role || 'Crew'}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-white/10 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </header>

      <div className="px-5 pt-6 space-y-5 max-w-md mx-auto">
        {/* 1. GIANT CLOCK IN / OUT */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={toggleClock}
          disabled={clockLoading}
          className={`w-full rounded-[2rem] py-12 flex flex-col items-center justify-center gap-3 font-black shadow-2xl transition-all disabled:opacity-70 ${
            clockedIn
              ? 'bg-rose-500 text-white'
              : 'bg-primary text-brand-navy'
          }`}
        >
          {clockLoading ? (
            <Loader2 className="animate-spin" size={48} />
          ) : (
            <Clock size={56} strokeWidth={2.5} />
          )}
          <span className="text-3xl tracking-tight">
            {clockedIn ? 'CLOCK OUT' : 'CLOCK IN'}
          </span>
          <span className="text-sm font-bold opacity-80">
            {clockedIn ? 'Tap when you finish' : 'Tap to start your shift'}
          </span>
          {todaySheet && todaySheet.totalHours > 0 && (
            <span className="mt-1 text-xs font-black uppercase tracking-widest opacity-90">
              Today: {todaySheet.totalHours} hrs
            </span>
          )}
        </motion.button>

        {/* 2. MY TASKS */}
        <section className="bg-white/5 border border-white/10 rounded-[1.75rem] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-primary/15 text-primary rounded-2xl flex items-center justify-center">
              <ListChecks size={22} />
            </div>
            <h2 className="text-lg font-black">My Tasks</h2>
            <span className="ml-auto text-sm font-black text-white/40">{tasks.length}</span>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-white/40 font-bold py-2">No tasks assigned right now.</p>
          ) : (
            <ul className="space-y-2.5">
              {tasks.slice(0, 6).map((task) => (
                <li
                  key={task._id}
                  className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3.5"
                >
                  <span className="flex-1 text-base font-bold truncate">{task.title}</span>
                  <span
                    className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${taskBadge(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 3. MY HOURS */}
        <section className="bg-white/5 border border-white/10 rounded-[1.75rem] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-primary/15 text-primary rounded-2xl flex items-center justify-center">
              <Timer size={22} />
            </div>
            <h2 className="text-lg font-black">My Hours</h2>
            <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-white/40">
              This Week
            </span>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-4xl font-black text-primary leading-none">
                {weekSheet?.totalHours ?? 0}
              </p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
                Total Hours
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-300 leading-none">
                {weekSheet?.totalOvertime ?? 0}
              </p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
                Overtime
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-white/80 leading-none">
                {weekSheet?.days ?? 0}
              </p>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
                Days
              </p>
            </div>
          </div>
        </section>

        {/* 4. MY PAY */}
        <section className="bg-white/5 border border-white/10 rounded-[1.75rem] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-primary/15 text-primary rounded-2xl flex items-center justify-center">
              <Wallet size={22} />
            </div>
            <h2 className="text-lg font-black">My Pay</h2>
            {payslip?.period && (
              <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-white/40">
                {payslip.period}
              </span>
            )}
          </div>
          {payNet == null ? (
            <p className="text-sm text-white/40 font-bold py-2">No payslips yet.</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white leading-none">{format(payNet)}</p>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1.5">
                  Latest Net Pay
                </p>
              </div>
              <span
                className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border ${
                  payStatus?.toLowerCase() === 'paid'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {payStatus?.toLowerCase() === 'paid' && <CheckCircle2 size={14} />}
                {payStatus}
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default WorkerHome;
