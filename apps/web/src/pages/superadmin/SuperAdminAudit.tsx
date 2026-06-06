import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../../components/layout/DashboardShell';
import apiClient from '../../api/client';
import { t } from '../../theme';
import { exportToCSV } from '../../utils/exporters';
import {
  Loader2,
  Inbox,
  ScrollText,
  Ban,
  RotateCcw,
  Crown,
  Wallet,
  UserCog,
  Activity,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditEntry {
  _id: string;
  actor: { name: string; email: string } | null;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  metadata: Record<string, any>;
  ip: string;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; i: any; tone: string }> = {
  'company.suspend': { label: 'Suspended company', i: Ban, tone: 'text-rose-400 bg-rose-500/10' },
  'company.reinstate': {
    label: 'Reinstated company',
    i: RotateCcw,
    tone: 'text-emerald-400 bg-emerald-500/10',
  },
  'company.plan.change': {
    label: 'Changed plan',
    i: Crown,
    tone: 'text-amber-400 bg-amber-500/10',
  },
  'company.wallet.adjust': {
    label: 'Adjusted wallet',
    i: Wallet,
    tone: 'text-indigo-400 bg-indigo-500/10',
  },
  'user.role.change': {
    label: 'Changed user role',
    i: UserCog,
    tone: 'text-sky-400 bg-sky-500/10',
  },
};

const friendly = (action: string) =>
  ACTION_META[action]?.label ||
  action
    .split('.')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const renderMetadata = (e: AuditEntry) => {
  const m = e.metadata || {};
  const parts: string[] = [];
  if (m.from !== undefined && m.to !== undefined) parts.push(`${m.from} → ${m.to}`);
  if (m.type) parts.push(String(m.type));
  if (m.amount !== undefined) parts.push(`amount ${Number(m.amount).toLocaleString()}`);
  if (m.plan) parts.push(`plan ${m.plan}`);
  if (m.role) parts.push(`role ${m.role}`);
  if (m.reason) parts.push(`“${m.reason}”`);
  if (m.note) parts.push(`“${m.note}”`);
  return parts.join(' • ');
};

const ACTION_FILTERS = [
  'all',
  'company.suspend',
  'company.plan.change',
  'company.wallet.adjust',
  'user.role.change',
];

const SuperAdminAudit = () => {
  const [action, setAction] = useState('all');

  const { data: entries, isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['sa-audit', action],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (action !== 'all') params.action = action;
      return (await apiClient.get('/superadmin/audit', { params })).data;
    },
  });

  const handleExport = () => {
    const rows = (entries ?? []).map((e) => ({
      time: e.createdAt ? new Date(e.createdAt).toLocaleString() : '',
      actor: e.actor?.name || e.actorName || 'System',
      action: friendly(e.action),
      target: e.targetLabel || '',
      ip: e.ip || '',
    }));
    exportToCSV(`cpromark-audit-${Date.now()}`, rows, [
      { key: 'time', label: 'Time' },
      { key: 'actor', label: 'Actor' },
      { key: 'action', label: 'Action' },
      { key: 'target', label: 'Target' },
      { key: 'ip', label: 'IP' },
    ]);
  };

  return (
    <DashboardShell>
      <div className="max-w-[1100px] mx-auto pb-20">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className={t.iconBoxNavy}>
                <ScrollText size={20} />
              </div>
              <h1 className={t.h2}>Audit Log</h1>
            </div>
            <p className={t.muted}>Reverse-chronological trail of platform administration.</p>
          </div>
          <button
            onClick={handleExport}
            className={`${t.btnSecondary} flex items-center gap-2 self-start md:self-auto`}
          >
            <Download size={15} />
            Export CSV
          </button>
        </header>

        {/* ACTION FILTER */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {ACTION_FILTERS.map((a) => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                action === a
                  ? 'bg-primary text-brand-navy border-primary shadow-yellow'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {a === 'all' ? 'All' : friendly(a)}
            </button>
          ))}
        </div>

        {/* FEED */}
        {isLoading ? (
          <div className="bg-card border border-border rounded-[2.5rem] py-20 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                Loading audit trail...
              </p>
            </div>
          </div>
        ) : !entries || entries.length === 0 ? (
          <div className={t.emptyState}>
            <Inbox className="mx-auto text-muted-foreground/30 mb-4" size={56} />
            <h3 className="text-lg font-black text-muted-foreground">No audit entries</h3>
            <p className="text-sm text-foreground/40 mt-1">
              Administrative actions will be recorded here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {entries.map((e, idx) => {
                const meta = ACTION_META[e.action];
                const Icon = meta?.i || Activity;
                const tone = meta?.tone || 'text-muted-foreground bg-muted';
                const details = renderMetadata(e);
                return (
                  <motion.div
                    key={e._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                    className="bg-card border border-border rounded-3xl p-5 shadow-sm flex items-start gap-4 hover:border-primary/20 transition-all"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tone}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-black text-foreground text-sm">{friendly(e.action)}</p>
                        {e.targetLabel && (
                          <span className="text-[11px] font-bold text-muted-foreground">
                            → {e.targetLabel}
                          </span>
                        )}
                      </div>
                      {details && (
                        <p className="text-xs text-foreground/60 font-medium mt-1 break-words">
                          {details}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {e.actor?.name || e.actorName || 'System'}
                        </span>
                        <span className="text-foreground/20">•</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}
                        </span>
                        {e.ip && (
                          <>
                            <span className="text-foreground/20">•</span>
                            <span className="text-[10px] font-medium text-muted-foreground/70">
                              {e.ip}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default SuperAdminAudit;
