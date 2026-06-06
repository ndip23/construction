import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../api/client';
import { Loader2, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, token } = response.data;
      setAuth(user, token);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'staff') navigate('/staff/dashboard');
      else navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 pt-24 relative overflow-hidden">
      <PublicNavbar />
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-card border border-border p-8 md:p-12 rounded-[2.5rem] shadow-card w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center font-black text-brand-navy text-2xl italic mx-auto mb-6 shadow-lg">CP</div>
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tighter">Welcome to Cpromark</h2>
          <p className="text-foreground/40 text-sm font-medium">Access your professional workspace.</p>
        </div>

        {error && (
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold">
            <AlertCircle size={16} />{error}
          </motion.div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 px-1 block">Account Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full p-4 rounded-2xl bg-muted border border-border text-foreground placeholder-white/20 outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Security Key</label>
              <Link to="/forgot-password" className="text-[10px] font-bold text-primary hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 pr-12 rounded-2xl bg-muted border border-border text-foreground placeholder-white/20 outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 transition-colors">
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1 pb-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">End-to-End Encrypted</span>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full bg-primary text-brand-navy p-5 rounded-2xl font-black shadow-yellow hover:bg-primary-dim hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3">
            {isLoading ? <><Loader2 className="animate-spin" size={20} />Authenticating...</> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-border pt-6">
          <p className="text-xs text-foreground/30 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
