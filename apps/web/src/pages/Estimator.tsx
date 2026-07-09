import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';
import apiClient from '../api/client';
import { 
  Calculator, 
  HelpCircle, 
  MapPin, 
  TrendingUp, 
  UserCheck, 
  ShoppingBag, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  Wrench,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Compact number formatter for large African currency values
const formatCompact = (value: number): string => {
  if (value == null || isNaN(value)) return '0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return sign + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, '')) + 'B';
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return sign + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, '')) + 'M';
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return sign + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, '')) + 'K';
  }
  return sign + abs.toLocaleString();
};

interface Material {
  name: string;
  quantity: string;
  description: string;
}

interface Stage {
  stage: string;
  cost: number;
  duration: string;
}

interface Estimate {
  totalCost: number;
  currency: string;
  materials: Material[];
  laborCost: number;
  stages: Stage[];
  projectDuration: string;
  recommendations: string[];
  category: string;
  location: string;
}

interface FollowUpQuestion {
  question: string;
  suggestions: string[];
}

interface EstimateResponse {
  needsMoreInfo: boolean;
  followUpQuestions: FollowUpQuestion[];
  estimate: Estimate | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Estimator() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [quality, setQuality] = useState('Standard');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Follow-up state
  const [followUps, setFollowUps] = useState<FollowUpQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  
  // Result state
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── RESTORE STATE FROM SESSION (so estimate survives navigation) ──
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem('cpromark-estimate-session');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.estimate) setEstimate(s.estimate);
        if (s.description) setDescription(s.description);
        if (s.location) setLocation(s.location);
        if (s.quality) setQuality(s.quality);
        if (s.history) setHistory(s.history);
      }
    } catch (_) { /* ignore parse errors */ }
  }, []);

  // ── SAVE STATE TO SESSION before navigating away ──
  const saveAndNavigate = (path: string) => {
    try {
      sessionStorage.setItem('cpromark-estimate-session', JSON.stringify({
        estimate, description, location, quality, history
      }));
    } catch (_) { /* storage full — proceed anyway */ }
    navigate(path);
  };

  const startEstimation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setError(null);
    setStatusMessage('Analyzing your project description...');

    // Build the initial message
    const locationPrompt = location ? ` Location: ${location}.` : '';
    const qualityPrompt = ` Quality Tier: ${quality}.`;
    const message = `Project description: ${description}.${locationPrompt}${qualityPrompt}`;

    const newHistory: ChatMessage[] = [{ role: 'user', content: message }];
    setHistory(newHistory);

    try {
      setTimeout(() => setStatusMessage('Consulting regional material database...'), 1500);
      setTimeout(() => setStatusMessage('Generating quantity takeoff and stage labor hours...'), 3000);

      const { data } = await apiClient.post<EstimateResponse>('/ai/estimate', {
        message,
        history: []
      });

      if (data.needsMoreInfo) {
        setFollowUps(data.followUpQuestions);
        setAnswers(new Array(data.followUpQuestions.length).fill(''));
      } else if (data.estimate) {
        setEstimate(data.estimate);
      } else {
        setError('The estimator could not process this project. Please describe it differently.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage('Reviewing details and recalculating costs...');

    // Append the questions and answers to history
    const followUpText = followUps.map((q, i) => `Question: ${q.question}\nAnswer: ${answers[i]}`).join('\n');
    const updatedHistory: ChatMessage[] = [
      ...history,
      { role: 'assistant', content: `I need some more details to give you an accurate estimate:\n${followUps.map(q => q.question).join('\n')}` },
      { role: 'user', content: followUpText }
    ];
    setHistory(updatedHistory);

    try {
      setTimeout(() => setStatusMessage('Fetching local supplier price lists...'), 1500);
      const { data } = await apiClient.post<EstimateResponse>('/ai/estimate', {
        message: `Here are the follow up details:\n${followUpText}`,
        history: updatedHistory
      });

      if (data.needsMoreInfo) {
        setFollowUps(data.followUpQuestions);
        setAnswers(new Array(data.followUpQuestions.length).fill(''));
      } else if (data.estimate) {
        setEstimate(data.estimate);
        setFollowUps([]);
      } else {
        setError('The estimator could not process this project. Please describe it differently.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setDescription('');
    setLocation('');
    setQuality('Standard');
    setHistory([]);
    setFollowUps([]);
    setAnswers([]);
    setEstimate(null);
    setError(null);
    sessionStorage.removeItem('cpromark-estimate-session');
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-between">
      <PublicNavbar />
      
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/5 blur-[150px] rounded-full pointer-events-none z-0" />

      <main className="pt-32 px-6 max-w-6xl mx-auto w-full pb-40 relative z-10 flex-grow">
        
        {/* HERO TITLE */}
        <section className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary-pale border border-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
          >
            <Sparkles size={12} className="animate-pulse" /> Free AI Tools
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-tight"
          >
            AI Construction <span className="text-primary italic">Cost Estimator</span>
          </motion.h1>
          <p className="text-muted-foreground font-medium text-base max-w-xl mx-auto">
            Describe your building or renovation project in simple language. Get instant cost estimates, material takeoffs, and connect with local builders.
          </p>
        </section>

        {/* ESTIMATOR PANEL */}
        <div className="bg-card border border-border rounded-[3rem] p-8 md:p-12 shadow-sm">
          <AnimatePresence mode="wait">
            
            {/* 1. LOADING STATE */}
            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-24 text-center flex flex-col items-center justify-center"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <Calculator className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={24} />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-2">Analyzing Project Data</h3>
                <p className="text-muted-foreground font-medium max-w-md animate-pulse">{statusMessage}</p>
              </motion.div>
            )}

            {/* 2. ERROR STATE */}
            {!loading && error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <HelpCircle size={32} />
                </div>
                <h3 className="text-2xl font-black text-rose-500 tracking-tight mb-2">Calculation Failed</h3>
                <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">{error}</p>
                <button 
                  onClick={resetAll}
                  className="bg-primary text-brand-navy px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {/* 3. INPUT FORM */}
            {!loading && !error && !estimate && followUps.length === 0 && (
              <motion.form 
                key="input-form"
                onSubmit={startEstimation}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-foreground/50">Describe your project *</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="e.g., I want to build a modern 4-bedroom duplex with standard finishes, a kitchen, and a small swimming pool in the backyard..."
                    className="w-full bg-background border border-border rounded-3xl p-6 outline-none text-foreground font-semibold placeholder:text-foreground/20 focus:border-primary transition-all text-base resize-none"
                  />
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground font-semibold mt-2">
                    <span className="bg-muted px-3 py-1.5 rounded-full">💡 Tip: Include size (sqm) or room count for better accuracy.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-foreground/50">Location / City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                      <input 
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g., Douala, Cameroon or Lagos, Nigeria"
                        className="w-full bg-background border border-border rounded-2xl py-4 pl-12 pr-4 outline-none text-foreground font-semibold placeholder:text-foreground/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-foreground/50">Quality standard</label>
                    <select 
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full bg-background border border-border rounded-2xl py-4 px-4 outline-none text-foreground font-bold focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="Standard">Standard (Durable, cost-effective finishes)</option>
                      <option value="Premium">Premium (High-end finishes and fittings)</option>
                      <option value="Luxury">Luxury (Bespoke import materials, smart home features)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <button 
                    type="submit"
                    className="bg-primary text-brand-navy px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all flex items-center gap-2"
                  >
                    Calculate Project Cost <ArrowRight size={16} />
                  </button>
                </div>
              </motion.form>
            )}

            {/* 4. FOLLOW-UP QUESTIONS */}
            {!loading && !error && !estimate && followUps.length > 0 && (
              <motion.form 
                key="follow-up-form"
                onSubmit={submitAnswers}
                className="space-y-8"
              >
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-3xl mb-4">
                  <h4 className="text-lg font-black text-foreground mb-1">Almost there!</h4>
                  <p className="text-muted-foreground text-sm font-medium">Just pick the options below or type your own answer — the AI will handle the rest.</p>
                </div>

                {followUps.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-foreground/50">Question {idx + 1}</label>
                    <p className="text-foreground font-bold text-base">{q.question}</p>
                    
                    {/* Suggestion Chips */}
                    {q.suggestions && q.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {q.suggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => {
                              const newAns = [...answers];
                              newAns[idx] = suggestion;
                              setAnswers(newAns);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                              answers[idx] === suggestion
                                ? 'bg-primary text-brand-navy border-primary shadow-yellow'
                                : 'bg-muted text-foreground border-border hover:border-primary/30 hover:bg-primary/5'
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Text input as fallback */}
                    <input 
                      type="text"
                      value={answers[idx] || ''}
                      onChange={(e) => {
                        const newAns = [...answers];
                        newAns[idx] = e.target.value;
                        setAnswers(newAns);
                      }}
                      required
                      placeholder="Or type your own answer..."
                      className="w-full bg-background border border-border rounded-2xl py-4 px-4 outline-none text-foreground font-semibold placeholder:text-foreground/20 focus:border-primary transition-all"
                    />
                  </div>
                ))}

                <div className="pt-4 border-t border-border flex justify-between gap-4">
                  <button 
                    type="button" 
                    onClick={resetAll}
                    className="bg-muted text-foreground px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-background transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-primary text-brand-navy px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all flex items-center gap-2"
                  >
                    Recalculate Estimate <Sparkles size={14} />
                  </button>
                </div>
              </motion.form>
            )}

            {/* 5. ESTIMATION RESULT DASHBOARD */}
            {!loading && !error && estimate && (
              <motion.div 
                key="result-dashboard"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12 animate-in duration-500"
              >
                
                {/* ESTIMATION SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Total Cost */}
                  <div className="bg-background border border-border p-8 rounded-3xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-primary/5 rounded-full pointer-events-none" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 block mb-2">Total Estimated Cost</span>
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                        <span className="text-primary text-lg mr-1.5 font-extrabold italic uppercase">{estimate.currency}</span>
                        {formatCompact(estimate.totalCost)}
                      </h2>
                      <p className="text-xs text-muted-foreground font-semibold mt-1">
                        {estimate.totalCost?.toLocaleString()} {estimate.currency}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <DollarSign size={14} className="text-primary" /> Regional market rates applied
                    </div>
                  </div>

                  {/* Labor Cost */}
                  <div className="bg-background border border-border p-8 rounded-3xl flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 block mb-2">Estimated Labor Cost</span>
                      <h3 className="text-3xl font-black tracking-tight">
                        <span className="text-primary text-lg mr-1.5 font-bold italic uppercase">{estimate.currency}</span>
                        {formatCompact(estimate.laborCost)}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold mt-1">
                        {estimate.laborCost?.toLocaleString()} {estimate.currency}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <Wrench size={14} className="text-primary" /> Estimated contractor & site work
                    </div>
                  </div>

                  {/* Project Duration */}
                  <div className="bg-background border border-border p-8 rounded-3xl flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 block mb-2">Project Duration</span>
                      <h3 className="text-3xl font-black tracking-tight text-foreground">
                        {estimate.projectDuration}
                      </h3>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <Calendar size={14} className="text-primary" /> Projected completion timeline
                    </div>
                  </div>

                </div>

                {/* STAGE BREAKDOWN TIMELINE */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <Layers className="text-primary" size={22} /> Stage-by-Stage Cost Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {estimate.stages?.map((st, i) => (
                      <div key={i} className="bg-background border border-border p-6 rounded-2xl relative shadow-sm hover:border-primary/20 transition-all">
                        <span className="absolute top-4 right-4 text-xs font-black text-foreground/20">{String(i + 1).padStart(2, '0')}</span>
                        <h4 className="font-black text-foreground text-lg mb-2 capitalize pr-8">{st.stage}</h4>
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cost</p>
                            <span className="font-extrabold text-foreground text-sm block">{estimate.currency} {formatCompact(st.cost)}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">{st.cost?.toLocaleString()}</span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Duration</p>
                            <span className="font-extrabold text-foreground text-sm block">{st.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MATERIALS TAKEOFF */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <Wrench className="text-primary" size={22} /> Estimated Material Quantities
                  </h3>
                  <div className="bg-background border border-border rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="p-5 text-xs font-black uppercase tracking-widest text-foreground/50">Material</th>
                            <th className="p-5 text-xs font-black uppercase tracking-widest text-foreground/50">Estimated Qty</th>
                            <th className="p-5 text-xs font-black uppercase tracking-widest text-foreground/50">Usage Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estimate.materials?.map((mat, i) => (
                            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                              <td className="p-5 font-black text-foreground">{mat.name}</td>
                              <td className="p-5 font-extrabold text-primary">{mat.quantity}</td>
                              <td className="p-5 text-sm font-medium text-muted-foreground">{mat.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* SAVINGS & RECOMMENDATIONS */}
                {estimate.recommendations && estimate.recommendations.length > 0 && (
                  <div className="bg-primary-pale border border-primary/10 p-8 rounded-3xl">
                    <h3 className="text-xl font-black text-brand-navy mb-4 flex items-center gap-2">
                      <TrendingUp size={20} /> Budgeting & Cost Saving Recommendations
                    </h3>
                    <ul className="space-y-3">
                      {estimate.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 text-sm font-semibold text-brand-navy/80">
                          <span className="text-primary font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* DIRECTORY & MARKETPLACE INTEGRATION CTA SECTION */}
                <div className="pt-8 border-t border-border">
                  <div className="bg-muted/40 border border-border rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h4 className="text-2xl font-black tracking-tight mb-2">Ready to Start Your Project?</h4>
                      <p className="text-muted-foreground text-sm font-medium">Use Cpromark networks to execute this estimate directly with verified providers.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
                      
                      {/* Hire Professionals Button — filter by location only, not category */}
                      <button
                        onClick={() => {
                          const loc = encodeURIComponent(estimate.location || '');
                          saveAndNavigate(`/directory?location=${loc}`);
                        }}
                        className="bg-primary text-brand-navy px-8 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all flex items-center justify-center gap-2"
                      >
                        <UserCheck size={16} /> Hire Professionals for This Project
                      </button>

                      {/* Buy Materials Button — use first material for a focused search */}
                      <button
                        onClick={() => {
                          const firstMaterial = estimate.materials?.[0]?.name || '';
                          const search = encodeURIComponent(firstMaterial);
                          const loc = encodeURIComponent(estimate.location || '');
                          saveAndNavigate(`/marketplace?search=${search}&location=${loc}`);
                        }}
                        className="bg-foreground text-background px-8 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={16} /> Find Building Materials Near Me
                      </button>

                    </div>
                  </div>
                </div>

                {/* Restart Estimation Button */}
                <div className="flex justify-center pt-4">
                  <button 
                    onClick={resetAll}
                    className="text-muted-foreground hover:text-foreground font-black text-xs uppercase tracking-widest flex items-center gap-2 py-3 px-6 rounded-xl hover:bg-muted/50 transition-all"
                  >
                    <RotateCcw size={16} /> Reset Estimator
                  </button>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      <PublicFooter />
    </div>
  );
}
