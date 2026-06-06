import { useState, useRef, useEffect } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { useAuthStore } from '../../store/useAuthStore';
import apiClient from '../../api/client';
import { 
  BrainCircuit, 
  Zap, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StaffAI = () => {
  useAuthStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/ai/chat', { 
        message: text,
        history: messages.slice(-4), // Context window
        context: "engineering-technical" // Tells backend to use engineering persona
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Technical connection lost. Please verify your site connectivity." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        
        {/* HERO HEADER - Collapses when chat starts */}
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div 
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="bg-gradient-to-br from-[#001529] to-[#002b52] p-12 md:p-16 rounded-[4rem] text-center text-foreground mb-10 shadow-2xl relative overflow-hidden shrink-0"
            >
              <BrainCircuit className="mx-auto mb-8 text-primary" size={56} />
              <h1 className="text-4xl font-black italic tracking-tighter mb-4">Cpromark AI <span className="text-primary">Eng.</span></h1>
              <p className="text-primary font-medium mb-12 max-w-lg mx-auto">Sarah, I'm ready to calculate material weights, draft site logs, or review technical specs.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
                 {[
                   'Concrete Mix (C25) Ratio', 
                   'Estimate Rebar Weight', 
                   'Draft Daily Site Log', 
                   'Safety Risk Checklist'
                 ].map(t => (
                   <button 
                    key={t} 
                    onClick={() => handleSendMessage(t)}
                    className="p-4 bg-card/10 hover:bg-card/20 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-border/5 transition-all text-left flex items-center justify-between group"
                   >
                     {t} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
                   </button>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHAT DISPLAY */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
           {messages.map((m, i) => (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key={i} 
               className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
             >
               <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-[2.5rem] text-sm leading-relaxed shadow-sm ${
                 m.role === 'user' 
                 ? 'bg-primary text-brand-navy rounded-tr-none shadow-yellow font-bold' 
                 : 'bg-card text-foreground/90 border border-border rounded-tl-none font-medium'
               }`}>
                 {m.content}
               </div>
             </motion.div>
           ))}
           {isLoading && (
             <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-widest px-4">
                <Loader2 className="animate-spin" size={16} /> Technical Analysis in progress...
             </div>
           )}
           <div ref={scrollRef} />
        </div>

        {/* INPUT BAR */}
        <div className="p-6 bg-card rounded-[3rem] border border-border shadow-premium mt-4">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-4"
          >
             <button 
              type="button" 
              onClick={() => setMessages([])}
              className="p-4 text-foreground/35 hover:text-rose-500 transition-colors"
             >
                <RotateCcw size={20} />
             </button>
             <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Sarah's technical assistant..." 
                className="flex-1 py-4 outline-none text-sm font-bold text-foreground placeholder:text-foreground/35" 
             />
             <button 
                disabled={isLoading || !input.trim()}
                type="submit"
                className="bg-primary text-brand-navy p-5 rounded-[1.5rem] shadow-xl hover:bg-primary-dim disabled:bg-muted disabled:text-brand-navy/35 transition-all flex items-center gap-2 group"
             >
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest px-2 group-hover:pr-4 transition-all">Submit Query</span>
                <Zap size={20} className={isLoading ? 'animate-pulse' : ''} />
             </button>
          </form>
        </div>

        <div className="py-4 text-center">
            <p className="text-[9px] font-black text-foreground/35 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Sparkles size={10} className="text-primary" /> Cpromark Engineering Cloud • v4.0 Technical Logic
            </p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default StaffAI;