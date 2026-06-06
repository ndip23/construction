import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import { Sparkles, Zap, FileSearch, Plus, Send, Loader2, ScanSearch, FolderKanban, Clock, Hammer, Trash2, Save, ListChecks } from 'lucide-react';
import apiClient from '../api/client';
import { motion } from 'framer-motion';
import { t } from '../theme';
import { useCurrencyStore } from '../store/useCurrencyStore';

const typeIcon: Record<string, string> = {
  missing: '🟦', duplicate: '🟡', alternative: '🟣', outlier: '🔴',
};

// Heuristic: does this message read like a "build me a BOQ" request?
const isBuildRequest = (text: string) => {
  const s = text.toLowerCase();
  return /\b(boq|bill of quantit|estimate the cost|cost to build|build (?:me|a|an)|construct|bedroom|bungalow|duplex|storey|story|warehouse|generate.*boq|draft.*boq)\b/.test(s);
};

interface DraftItem {
  description: string;
  unit: string;
  qty: number;
  rate: number;            // current (possibly edited) rate
  suggestedRate: number;   // original AI rate
  category: string;
  confidence: 'high' | 'medium' | 'low';
  rejected: boolean;
}

interface Draft {
  brief: string;
  summary: string;
  location: string | null;
  items: DraftItem[];
  projectId: string;
}

const confidenceBadge: Record<string, string> = {
  high: t.badgeGreen, medium: t.badgeAmber, low: t.badgeRed,
};

const AIAssistant = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { fromUSD, format } = useCurrencyStore();
  const money = (usd: number) => format(fromUSD(usd || 0));

  // Real portfolio data for the sidebar + BOQ analysis target
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await apiClient.get('/projects')).data,
  });
  const { data: boqs } = useQuery({
    queryKey: ['boq-items'],
    queryFn: async () => (await apiClient.get('/boq')).data,
  });

  const boqList: any[] = Array.isArray(boqs) ? boqs : [];
  const projectList: any[] = Array.isArray(projects) ? projects : [];

  const totalBOQ = boqList.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const pendingCount = boqList.reduce(
    (a, b) => a + (b.items || []).filter((i: any) => i.status === 'pending').length, 0
  );
  const riskProject = projectList
    .filter((p) => p.budget > 0)
    .map((p) => ({ ...p, util: (p.spent || 0) / p.budget }))
    .sort((a, b) => b.util - a.util)[0];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const push = (role: string, content: string) => setMessages((prev) => [...prev, { role, content }]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim()) return;
    // Conversational BOQ: route build-style requests to the generator
    if (isBuildRequest(text)) {
      setInput('');
      return generateDraftBOQ(text);
    }
    push('user', text);
    setInput('');
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/ai/chat', {
        message: text,
        history: messages.slice(-5),
      });
      push('assistant', data.response);
    } catch {
      push('assistant', "I'm sorry, I'm having trouble connecting to the site data right now.");
    } finally {
      setIsLoading(false);
    }
  };

  // Conversational BOQ generation — turns a free-text brief into a draft BOQ
  const generateDraftBOQ = async (brief: string, projectId?: string) => {
    push('user', brief);
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/boq/generate', { brief, projectId });
      const items: DraftItem[] = (data.items || []).map((it: any) => ({
        description: it.description,
        unit: it.unit || 'unit',
        qty: Number(it.qty) || 1,
        rate: Number(it.rate) || 0,
        suggestedRate: Number(it.rate) || 0,
        category: it.category || 'General',
        confidence: ['high', 'medium', 'low'].includes(it.confidence) ? it.confidence : 'medium',
        rejected: false,
      }));
      if (!items.length) {
        push('assistant', "I couldn't draft a BOQ from that brief. Try adding a bit more detail about what you want to build.");
        return;
      }
      setDraft({
        brief,
        summary: data.summary || 'Draft BOQ generated from your brief.',
        location: data.location || null,
        items,
        projectId: projectId || (projectList[0]?._id ?? ''),
      });
      push('assistant', `📐 ${data.summary || 'Here is a draft BOQ based on your brief.'}\n\nReview the line items below — edit rates, reject anything you don't need, pick a project, then Save to BOQ.`);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message;
      if (status === 429) {
        push('assistant', msg || 'AI quota reached for now — please try again in a minute.');
      } else {
        push('assistant', msg || "BOQ generation is currently unavailable. Please try again in a moment.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Draft editing helpers
  const setItemRate = (idx: number, rate: number) =>
    setDraft((d) => d && { ...d, items: d.items.map((it, i) => (i === idx ? { ...it, rate } : it)) });
  const toggleReject = (idx: number) =>
    setDraft((d) => d && { ...d, items: d.items.map((it, i) => (i === idx ? { ...it, rejected: !it.rejected } : it)) });
  const setDraftProject = (projectId: string) =>
    setDraft((d) => d && { ...d, projectId });

  const acceptedItems = draft ? draft.items.filter((it) => !it.rejected) : [];
  const draftTotal = acceptedItems.reduce((a, it) => a + it.qty * (it.rate || 0), 0);

  // Save accepted items into the chosen project's BOQ
  const saveDraftToProject = async () => {
    if (!draft || !draft.projectId || !acceptedItems.length) return;
    const project = projectList.find((p) => p._id === draft.projectId);
    setIsSaving(true);
    try {
      for (const it of acceptedItems) {
        await apiClient.post(`/boq/project/${draft.projectId}/item`, {
          description: it.description,
          unit: it.unit,
          qty: it.qty,
          rate: it.rate,
          source: 'ai',
          confidence: it.confidence,
          suggestedRate: it.suggestedRate,
          aiJustification: `Auto-generated from brief: "${draft.brief}"`,
        });
      }
      push('assistant', `✅ Saved ${acceptedItems.length} item${acceptedItems.length === 1 ? '' : 's'} (${money(draftTotal)}) to "${project?.name || 'the project'}" BOQ. Open the BOQ Engine to verify them.`);
      setDraft(null);
    } catch (e: any) {
      push('assistant', e?.response?.data?.message || "I couldn't save the BOQ to that project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Wire the "Analyze BOQ" preset to our real /boq/:id/analyze endpoint
  const runBOQAnalysis = async (projectId?: string, projectName?: string) => {
    push('user', projectName ? `Analyze BOQ — ${projectName}` : 'Analyze BOQ');
    setIsLoading(true);
    try {
      let pid = projectId;
      let pname = projectName;
      if (!pid) {
        const withItems = boqList.find((b) => (b.items || []).length);
        if (!withItems) {
          push('assistant', 'You have no BOQ items yet. Add items in the BOQ Engine, then I can analyze them.');
          return;
        }
        pid = withItems.project?._id || withItems.project;
        pname = withItems.project?.name || 'your project';
      }

      const { data } = await apiClient.post(`/boq/project/${pid}/analyze`);
      const sug: any[] = data.suggestions || [];
      if (!sug.length) {
        push('assistant', `✅ I reviewed the BOQ for "${pname}" — no issues found. It looks complete.`);
        return;
      }
      const body = sug
        .map((s) =>
          `${typeIcon[s.type] || '•'} [${String(s.type).toUpperCase()} · ${s.severity}] ${s.title}\n   ${s.detail}` +
          (s.item ? `\n   → Add: ${s.item.qty} ${s.item.unit} @ ${money(s.item.rate)}` : '')
        )
        .join('\n\n');
      push('assistant', `📋 BOQ Analysis — ${pname}\n\n${body}\n\nOpen the BOQ Engine to add or dismiss these suggestions.`);
    } catch {
      push('assistant', "I couldn't analyze the BOQ right now. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const onPreset = (task: string) => {
    if (task === 'Analyze BOQ') return runBOQAnalysis();
    // Material Estimate opens the AI price estimator on the BOQ Engine
    if (task === 'Material Estimate') return navigate('/dashboard/boq?estimate=1');
    // Build a BOQ: prompt the user to describe what they want to build
    if (task === 'Build a BOQ') {
      setInput('I want to build a 3-bedroom bungalow in Lagos, give me a BOQ');
      push('assistant', "Describe what you want to build — e.g. \"a 3-bedroom bungalow in Lagos\" — and I'll draft a full BOQ you can edit and save.");
      return;
    }
    return handleSendMessage(task);
  };

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        <header className="mb-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={24} />
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight italic">Cpromark AI</h1>
          </div>
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl font-bold text-muted-foreground hover:text-rose-500 transition-all shadow-sm text-xs"
          >
            <Plus size={16} /> New Session
          </button>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">

          {/* LEFT: CHAT INTERFACE */}
          <div className="lg:col-span-2 bg-card rounded-[3rem] shadow-premium border border-border flex flex-col overflow-hidden">

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center px-12">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="w-20 h-20 bg-primary-pale rounded-full flex items-center justify-center mx-auto mb-6">
                      <Zap className="text-primary" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">How can I assist your site today?</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {['Build a BOQ', 'Analyze BOQ', 'Material Estimate', 'Draft Proposal', 'Safety Check'].map((task) => (
                        <button
                          key={task}
                          onClick={() => onPreset(task)}
                          className="p-4 bg-muted rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-brand-navy transition-all flex items-center justify-center gap-1.5"
                        >
                          {task === 'Build a BOQ' && <Hammer size={12} />}
                          {task === 'Analyze BOQ' && <ScanSearch size={12} />}
                          {task}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-primary text-brand-navy rounded-tr-none shadow-lg shadow-yellow'
                        : 'bg-muted text-foreground/90 rounded-tl-none border border-border'
                    }`}>
                      {m.content}
                    </div>
                  </motion.div>
                ))
              )}
              {/* Interactive draft BOQ panel */}
              {draft && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${t.cardLg} p-6 space-y-4`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className={t.iconBoxYellow}><ListChecks size={20} /></div>
                      <div>
                        <h4 className={t.h4}>Draft Bill of Quantities</h4>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {acceptedItems.length} of {draft.items.length} item{draft.items.length === 1 ? '' : 's'} accepted
                          {draft.location ? ` · ${draft.location}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDraft(null)}
                      className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-rose-500 transition-colors"
                    >
                      Discard
                    </button>
                  </div>

                  <div className="space-y-2">
                    {draft.items.map((it, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          it.rejected
                            ? 'bg-muted/30 border-border opacity-50'
                            : 'bg-muted border-border'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold text-foreground truncate ${it.rejected ? 'line-through' : ''}`}>
                              {it.description}
                            </span>
                            <span className={confidenceBadge[it.confidence] || t.badgeNavy}>{it.confidence}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                            {it.qty} {it.unit} · {it.category}
                          </p>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">Rate</span>
                            <input
                              type="number"
                              value={it.rate}
                              disabled={it.rejected}
                              onChange={(e) => setItemRate(idx, Number(e.target.value))}
                              className="w-24 p-2 bg-background border border-border rounded-xl text-foreground text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40"
                            />
                          </div>
                          <span className="text-[11px] font-black text-foreground/70 mt-1">
                            = {money(it.qty * (it.rate || 0))}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleReject(idx)}
                          title={it.rejected ? 'Restore item' : 'Reject item'}
                          className={`shrink-0 p-2 rounded-xl transition-all ${
                            it.rejected
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                          }`}
                        >
                          {it.rejected ? <Plus size={14} /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className={t.label}>Accepted Total</span>
                    <span className="text-xl font-black text-foreground">{money(draftTotal)}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <div className="flex-1">
                      <label className={`${t.label} block mb-1.5`}>Save to project</label>
                      <select
                        value={draft.projectId}
                        onChange={(e) => setDraftProject(e.target.value)}
                        className={t.select}
                      >
                        {!projectList.length && <option value="">No projects available</option>}
                        {projectList.map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={saveDraftToProject}
                      disabled={isSaving || !draft.projectId || !acceptedItems.length}
                      className={`${t.btnPrimary} flex items-center justify-center gap-2 self-end disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                      Save to BOQ
                    </button>
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <div className="flex gap-2 items-center text-primary font-bold text-xs animate-pulse">
                  <Loader2 className="animate-spin" size={14} /> AI is analyzing...
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Bar */}
            <div className="p-6 bg-card border-t border-border">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="bg-muted p-2 rounded-[2rem] border border-border flex items-center gap-4 focus-within:ring-4 ring-primary transition-all"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about project budgets, site logs, or materials..."
                  className="flex-1 bg-transparent border-none outline-none px-6 py-2 text-sm font-medium text-foreground/90"
                />
                <button
                  disabled={isLoading}
                  className="bg-background p-4 rounded-2xl text-foreground hover:bg-primary disabled:opacity-50 transition-all shadow-xl"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: REAL PORTFOLIO ANALYTICS */}
          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar hidden lg:block">
            <h3 className={`${t.label} px-2`}>Live Portfolio Analytics</h3>

            {/* Real portfolio snapshot */}
            <div className="bg-background p-8 rounded-[3rem] text-foreground shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] opacity-10"><FolderKanban size={120} /></div>
              <h4 className="font-bold mb-5 flex items-center gap-2"><Zap size={16} className="text-primary" /> Portfolio</h4>
              <div className="space-y-4 relative z-10">
                <div className="flex items-end justify-between">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-black">Projects</span>
                  <span className="text-2xl font-black">{projectList.length}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-black">BOQ Value</span>
                  <span className="text-2xl font-black">{money(totalBOQ)}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-1"><Clock size={12} /> Pending</span>
                  <span className="text-2xl font-black text-amber-400">{pendingCount}</span>
                </div>
              </div>
            </div>

            {/* Real budget-risk alert */}
            <div className="bg-card border border-border p-8 rounded-[3rem] shadow-sm">
              <FileSearch className="text-primary mb-4" size={24} />
              <h4 className="font-bold text-foreground mb-2">Budget Risk Alert</h4>
              {riskProject ? (
                <>
                  <p className="text-[11px] text-brand-muted leading-relaxed">
                    <span className="font-bold text-foreground">'{riskProject.name}'</span> is at{' '}
                    <span className={`font-bold ${riskProject.util > 0.9 ? 'text-rose-500' : riskProject.util > 0.7 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {Math.round(riskProject.util * 100)}% of budget
                    </span>{' '}
                    ({money(riskProject.spent || 0)} / {money(riskProject.budget)}).
                  </p>
                  <button
                    onClick={() => runBOQAnalysis(riskProject._id, riskProject.name)}
                    className="mt-6 text-[10px] font-black text-primary uppercase hover:underline flex items-center gap-1"
                  >
                    <ScanSearch size={12} /> Analyze this BOQ
                  </button>
                </>
              ) : (
                <p className="text-[11px] text-brand-muted leading-relaxed">
                  No budgeted projects yet. Create a project with a budget to see risk tracking.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
};

export default AIAssistant;
