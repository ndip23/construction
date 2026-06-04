import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../../components/layout/DashboardShell';
import apiClient from '../../api/client';
import { t } from '../../theme';
import { exportToCSV } from '../../utils/exporters';
import {
  Loader2,
  Inbox,
  KeyRound,
  ShieldAlert,
  Activity,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginEvent {
  _id: string;
  identifier: string;
  user: { name: string; email: string } | null;
  company: { name: string; slug: string } | null;
  role: string;
  kind: 'manager' | 'worker';
  success: boolean;
  reason: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

interface LoginsResponse {
  events: LoginEvent[];
  stats: { failed24h: number; total24h: number };
}

type SuccessFilter = '' | 'true' | 'false';
type KindFilter = '' | 'manager' | 'worker';

const roleBadge = (role: string) => {
  switch (role) {
    case 'superadmin':
      return t.badgeAmber;
    case 'admin':
      return t.badgeGreen;
    case 'owner':
      return t.badgeYellow;
    default:
      return t.badgeNavy;
  }
};

const RESULT_PILLS: Array<{ label: string; value: SuccessFilter }> = [
  { label: 'All', value: '' },
  { label: 'Success', value: 'true' },
  { label: 'Failed', value: 'false' },
];

const KIND_PILLS: Array<{ label: string; value: KindFilter }> = [
  { label: 'All', value: '' },
  { label: 'Manager', value: 'manager' },
  { label: 'Worker', value: 'worker' },
];

const SuperAdminLogins = () => {
  const [success, setSuccess] = useState<SuccessFilter>('');
  const [kind, setKind] = useState<KindFilter>('');

  const { data, isLoading } = useQuery<LoginsResponse>({
    queryKey: ['sa-logins', success, kind],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (success) params.success = success;
      if (kind) params.kind = kind;
      return (await apiClient.get('/superadmin/logins', { params })).data;
    },
  });

  const events = data?.events ?? [];

  const handleExport = () => {
    const rows = events.map((e) => ({
      time: e.createdAt ? new Date(e.createdAt).toLocaleString() : '',
      identifier: e.identifier,
      user: e.user?.name || '',
      role: e.role,
      kind: e.kind,
      result: e.success ? 'OK' : 'Failed',
      reason: e.reason || '',
      ip: e.ip || '',
    }));
    exportToCSV(`buildhub-logins-${Date.now()}`, rows, [
      { key: 'time', label: 'Time' },
      { key: 'identifier', label: 'Identifier' },
      { key: 'user', label: 'User' },
      { key: 'role', label: 'Role' },
      { key: 'kind', label: 'Kind' },
      { key: 'result', label: 'Result' },
      { key: 'reason', label: 'Reason' },
      { key: 'ip', label: 'IP' },
    ]);
  };

  const statCards = [
    {
      label: 'Failed (24h)',
      value: data?.stats?.failed24h ?? 0,
      i: ShieldAlert,
      bg: 'bg-rose-500',
      tone: 'text-rose-400',
    },
    {
      label: 'Total (24h)',
      value: data?.stats?.total24h ?? 0,
      i: Activity,
      bg: 'bg-indigo-600',
      tone: 'text-foreground',
    },
  ];

  return (
    <DashboardShell>
      <div className="max-w-[1400px] mx-auto pb-20">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className={t.iconBoxNavy}>
                <KeyRound size={20} />
              </div>
              <h1 className={t.h2}>Login Activity</h1>
            </div>
            <p className={t.muted}>Authentication attempts across managers & workers.</p>
          </div>
          <button onClick={handleExport} className={`${t.btnSecondary} flex items-center gap-2`}>
            <Download size={15} />
            Export CSV
          </button>
        </header>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
          {statCards.map((c) => (
            <div
              key={c.label}
              className="bg-card border border-border p-6 rounded-3xl shadow-sm flex items-center gap-5"
            >
              <div
                className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center text-white shadow-lg`}
              >
                <c.i size={24} />
              </div>
              <div>
                <p className={`${t.label} mb-1`}>{c.label}</p>
                <h3 className={`text-2xl font-black tracking-tighter ${c.tone}`}>
                  {isLoading ? (
                    <Loader2 className="animate-spin text-foreground/15" />
                  ) : (
                    c.value.toLocaleString()
                  )}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${t.label} mr-1`}>Result</span>
            {RESULT_PILLS.map((p) => (
              <button
                key={p.label}
                onClick={() => setSuccess(p.value)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                  success === p.value
                    ? 'bg-primary text-brand-navy border-primary shadow-yellow'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`${t.label} mr-1`}>Kind</span>
            {KIND_PILLS.map((p) => (
              <button
                key={p.label}
                onClick={() => setKind(p.value)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                  kind === p.value
                    ? 'bg-primary text-brand-navy border-primary shadow-yellow'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[920px]">
              <thead className={`${t.tableHead} border-b border-border`}>
                <tr>
                  <th className="px-6 py-5">Time</th>
                  <th className="px-6 py-5">Identifier</th>
                  <th className="px-6 py-5">User</th>
                  <th className="px-6 py-5">Role</th>
                  <th className="px-6 py-5">Kind</th>
                  <th className="px-6 py-5">Result</th>
                  <th className="px-6 py-5">Reason</th>
                  <th className="px-6 py-5 text-right">IP</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                          Loading login activity...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-24 text-center">
                      <Inbox className="mx-auto text-muted-foreground/30 mb-4" size={56} />
                      <h3 className="text-lg font-black text-muted-foreground">No login events</h3>
                      <p className="text-sm text-foreground/40 mt-1">
                        Adjust your filters to see more activity.
                      </p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {events.map((e) => (
                      <motion.tr
                        key={e._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={t.tableRow}
                      >
                        <td className="px-6 py-5 text-xs font-bold text-muted-foreground whitespace-nowrap">
                          {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-foreground font-black text-xs truncate max-w-[200px]">
                            {e.identifier || '—'}
                          </p>
                          {e.company?.name && (
                            <p className="text-[10px] text-muted-foreground font-medium truncate">
                              {e.company.name}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-foreground/80">
                          {e.user?.name || '—'}
                        </td>
                        <td className="px-6 py-5">
                          <span className={roleBadge(e.role)}>{e.role || '—'}</span>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-muted-foreground capitalize">
                          {e.kind}
                        </td>
                        <td className="px-6 py-5">
                          <span className={e.success ? t.badgeGreen : t.badgeRed}>
                            {e.success ? 'OK' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs font-medium text-foreground/60 max-w-[200px] truncate">
                          {e.reason || '—'}
                        </td>
                        <td className="px-6 py-5 text-right text-[11px] font-medium text-muted-foreground/70 whitespace-nowrap">
                          {e.ip || '—'}
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

export default SuperAdminLogins;
