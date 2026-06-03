import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import { t } from '../theme';
import { useCurrencyStore } from '../store/useCurrencyStore';
import {
  Plus, ListChecks, Loader2, X, CheckCircle2, Calendar, Coins, Users,
  Minus, Trash2, AlertTriangle, Clock, CircleDot, FolderKanban,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────
interface Project {
  _id: string;
  name: string;
  progress?: number;
}

interface Worker {
  _id: string;
  name: string;
  role: string;
}

interface Task {
  _id: string;
  project: string;
  title: string;
  phase: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  progress: number;
  deadline?: string;
  costEstimate: number;
  assignedWorkers: { _id: string; name: string; role: string }[];
}

const PHASES = ['Foundation', 'Structure', 'Roofing', 'Electrical', 'Plumbing', 'Finishing', 'Other'];
const STATUSES: Task['status'][] = ['todo', 'in-progress', 'done', 'blocked'];

const STATUS_META: Record<Task['status'], { label: string; badge: string; icon: any }> = {
  todo: { label: 'To Do', badge: t.badgeNavy, icon: CircleDot },
  'in-progress': { label: 'In Progress', badge: t.badgeAmber, icon: Clock },
  done: { label: 'Done', badge: t.badgeGreen, icon: CheckCircle2 },
  blocked: { label: 'Blocked', badge: t.badgeRed, icon: AlertTriangle },
};

const isOverdue = (task: Task) =>
  !!task.deadline && task.status !== 'done' && new Date(task.deadline).getTime() < Date.now();

// ── Task Card ──────────────────────────────────────────────────────────────
const TaskCard = ({
  task,
  money,
  onUpdate,
  onDelete,
  saving,
}: {
  task: Task;
  money: (n: number) => string;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) => {
  const overdue = isOverdue(task);

  const bump = (delta: number) => {
    const next = Math.max(0, Math.min(100, task.progress + delta));
    onUpdate(task._id, { progress: next, ...(next === 100 ? { status: 'done' } : {}) });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${t.card} p-6 relative`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <h4 className="text-base font-black text-foreground leading-tight">{task.title}</h4>
        <button
          onClick={() => onDelete(task._id)}
          className="text-foreground/25 hover:text-rose-400 transition-colors shrink-0"
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Status selector */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {STATUSES.map((s) => {
          const m = STATUS_META[s];
          const active = task.status === s;
          return (
            <button
              key={s}
              onClick={() => onUpdate(task._id, { status: s })}
              className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                active ? m.badge : 'bg-muted text-muted-foreground/60 border-border hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={t.label}>Progress</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => bump(-10)}
              className="w-6 h-6 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="text-xs font-black text-foreground w-9 text-center">{task.progress}%</span>
            <button
              onClick={() => bump(10)}
              className="w-6 h-6 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={task.progress}
          onChange={(e) => {
            const next = Number(e.target.value);
            onUpdate(task._id, { progress: next, ...(next === 100 ? { status: 'done' } : {}) });
          }}
          className="w-full accent-primary"
        />
        <div className="h-2 rounded-full bg-muted overflow-hidden mt-1">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold pt-4 border-t border-border">
        <span className={`flex items-center gap-1.5 ${overdue ? 'text-rose-400' : 'text-muted-foreground'}`}>
          <Calendar size={13} />
          {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Coins size={13} className="text-primary" />
          {money(task.costEstimate || 0)}
        </span>
      </div>

      {/* Assigned workers */}
      {task.assignedWorkers?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {task.assignedWorkers.map((w) => (
            <span
              key={w._id}
              className="px-2.5 py-1 bg-muted text-muted-foreground text-[9px] font-black uppercase rounded-lg border border-border tracking-wider"
            >
              {w.name}
            </span>
          ))}
        </div>
      )}

      {saving && (
        <div className="absolute top-5 right-12">
          <Loader2 className="animate-spin text-primary" size={14} />
        </div>
      )}
    </motion.div>
  );
};

// ── Add Task Modal ───────────────────────────────────────────────────────
const AddTaskModal = ({
  projectId,
  workers,
  onClose,
  onCreate,
  creating,
}: {
  projectId: string;
  workers: Worker[];
  onClose: () => void;
  onCreate: (data: any) => void;
  creating: boolean;
}) => {
  const [form, setForm] = useState({
    title: '',
    phase: 'Foundation',
    deadline: '',
    costEstimate: '',
    assignedWorkers: [] as string[],
  });

  const toggleWorker = (id: string) =>
    setForm((f) => ({
      ...f,
      assignedWorkers: f.assignedWorkers.includes(id)
        ? f.assignedWorkers.filter((w) => w !== id)
        : [...f.assignedWorkers, id],
    }));

  return (
    <div className={t.overlay}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0" />
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className={`${t.modal} relative z-10 max-h-[90vh] overflow-y-auto`}
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-foreground/35 hover:text-rose-400 transition-colors">
          <X size={24} />
        </button>
        <div className="mb-8 text-center">
          <div className={`${t.iconBoxYellow} mx-auto mb-4`}>
            <ListChecks size={24} />
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Add Task</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`${t.label} block mb-1 px-1`}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={t.input}
              placeholder="e.g. Pour foundation slab"
            />
          </div>
          <div>
            <label className={`${t.label} block mb-1 px-1`}>Phase</label>
            <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} className={t.select}>
              {PHASES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`${t.label} block mb-1 px-1`}>Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className={t.input}
              />
            </div>
            <div>
              <label className={`${t.label} block mb-1 px-1`}>Cost (USD)</label>
              <input
                type="number"
                value={form.costEstimate}
                onChange={(e) => setForm({ ...form, costEstimate: e.target.value })}
                className={t.input}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className={`${t.label} block mb-2 px-1`}>Assign Workers</label>
            {workers.length === 0 ? (
              <p className="text-xs text-muted-foreground font-medium px-1">No workers available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {workers.map((w) => {
                  const active = form.assignedWorkers.includes(w._id);
                  return (
                    <button
                      key={w._id}
                      type="button"
                      onClick={() => toggleWorker(w._id)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                        active
                          ? 'bg-primary text-brand-navy border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      {w.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() =>
            onCreate({
              project: projectId,
              title: form.title,
              phase: form.phase,
              deadline: form.deadline || undefined,
              costEstimate: Number(form.costEstimate) || 0,
              assignedWorkers: form.assignedWorkers,
            })
          }
          disabled={creating || !form.title}
          className={`${t.btnPrimary} w-full mt-8 py-5 flex items-center justify-center gap-3 disabled:opacity-50`}
        >
          {creating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
          Create Task
        </button>
      </motion.div>
    </div>
  );
};

// ── KPI Card ───────────────────────────────────────────────────────────────
const Kpi = ({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: string }) => (
  <div className={`${t.statCard} flex items-center justify-between`}>
    <div>
      <p className={`${t.label} mb-1`}>{label}</p>
      <h3 className="text-3xl font-black text-foreground italic">{value}</h3>
    </div>
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tone}`}>
      <Icon size={20} />
    </div>
  </div>
);

// ── Page ─────────────────────────────────────────────────────────────────
const Tasks = () => {
  const queryClient = useQueryClient();
  const { fromUSD, format } = useCurrencyStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
  });

  const { data: workers } = useQuery<Worker[]>({
    queryKey: ['workforce-list'],
    queryFn: async () => (await apiClient.get('/workforce')).data,
  });

  // Default to the first project once loaded
  const projectId = selectedProject || projects?.[0]?._id || '';

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: async () => (await apiClient.get(`/tasks?project=${projectId}`)).data,
    enabled: !!projectId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/tasks', data),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      apiClient.put(`/tasks/${id}`, patch),
    onMutate: ({ id }) => setSavingId(id),
    onSettled: () => {
      invalidate();
      setSavingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onSuccess: invalidate,
  });

  const activeProject = projects?.find((p) => p._id === projectId);
  const list = tasks || [];

  const kpis = useMemo(
    () => ({
      total: list.length,
      done: list.filter((t) => t.status === 'done').length,
      inProgress: list.filter((t) => t.status === 'in-progress').length,
      blocked: list.filter((t) => t.status === 'blocked').length,
    }),
    [list]
  );

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const phase of PHASES) {
      const items = list.filter((t) => t.phase === phase);
      if (items.length) map[phase] = items;
    }
    return map;
  }, [list]);

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto pb-20">
        <header className={t.pageHeader}>
          <div>
            <h1 className={`${t.h2} italic`}>Project Tasks</h1>
            <p className={t.muted}>Plan, assign, and track work by construction phase.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={projectId}
              onChange={(e) => setSelectedProject(e.target.value)}
              className={`${t.select} w-56`}
            >
              {(projects || []).length === 0 && <option value="">No projects</option>}
              {(projects || []).map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setModalOpen(true)}
              disabled={!projectId}
              className={`${t.btnPrimary} flex items-center gap-2 disabled:opacity-50`}
            >
              <Plus size={16} /> Add Task
            </button>
          </div>
        </header>

        {!projectId ? (
          <div className={t.emptyState}>
            <div className={`${t.iconBoxYellow} mx-auto mb-6`}>
              <FolderKanban size={24} />
            </div>
            <h3 className="text-xl font-black text-foreground">No project selected</h3>
            <p className="text-sm text-muted-foreground font-medium mt-2 max-w-sm mx-auto">
              Create a project first, then add tasks to track its construction phases.
            </p>
          </div>
        ) : (
          <>
            {/* Overall progress */}
            <div className={`${t.cardDark} p-8 mb-8 text-brand-navy relative overflow-hidden`}>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {activeProject?.name || 'Project'}
                  </p>
                  <h2 className="text-3xl font-black text-white italic">Overall Progress</h2>
                </div>
                <span className="text-5xl font-black text-primary italic">
                  {activeProject?.progress ?? 0}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden relative z-10">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${activeProject?.progress ?? 0}%` }}
                />
              </div>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <Kpi label="Total Tasks" value={kpis.total} icon={ListChecks} tone="bg-primary-pale text-primary" />
              <Kpi label="Done" value={kpis.done} icon={CheckCircle2} tone="bg-emerald-500/10 text-emerald-400" />
              <Kpi label="In Progress" value={kpis.inProgress} icon={Clock} tone="bg-amber-500/10 text-amber-400" />
              <Kpi label="Blocked" value={kpis.blocked} icon={AlertTriangle} tone="bg-rose-500/10 text-rose-400" />
            </div>

            {isLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="animate-spin text-primary mx-auto" size={36} />
              </div>
            ) : list.length === 0 ? (
              <div className={t.emptyState}>
                <div className={`${t.iconBoxYellow} mx-auto mb-6`}>
                  <ListChecks size={24} />
                </div>
                <h3 className="text-xl font-black text-foreground">No tasks yet</h3>
                <p className="text-sm text-muted-foreground font-medium mt-2 mb-8 max-w-sm mx-auto">
                  Break this project into tasks across its construction phases.
                </p>
                <button onClick={() => setModalOpen(true)} className={`${t.btnPrimary} inline-flex items-center gap-2`}>
                  <Plus size={16} /> Add Task
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(grouped).map(([phase, items]) => (
                  <section key={phase}>
                    <h2 className={`${t.label} mb-5 flex items-center gap-2`}>
                      <Users size={12} /> {phase} · {items.length}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {items.map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          money={money}
                          saving={savingId === task._id}
                          onUpdate={(id, patch) => updateMutation.mutate({ id, patch })}
                          onDelete={(id) => deleteMutation.mutate(id)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        <AnimatePresence>
          {modalOpen && (
            <AddTaskModal
              projectId={projectId}
              workers={workers || []}
              onClose={() => setModalOpen(false)}
              onCreate={(data) => createMutation.mutate(data)}
              creating={createMutation.isPending}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
};

export default Tasks;
