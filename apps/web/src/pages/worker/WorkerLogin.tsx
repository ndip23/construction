import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { Loader2, AlertCircle, HardHat, Phone, Lock } from 'lucide-react';

const WorkerLogin = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length !== 4) {
      setError('PIN must be 4 digits.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/worker/login', { phone: phone.trim(), pin });
      const { token, worker } = res.data;

      // Worker portal token ONLY — never touch the manager session's 'token'.
      localStorage.setItem('workerToken', token);
      localStorage.setItem('workerProfile', JSON.stringify(worker || {}));

      navigate('/worker/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-brand-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Brand glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo + heading */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-brand-navy mx-auto mb-6 shadow-yellow">
            <HardHat size={40} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Worker Sign In</h1>
          <p className="text-white/50 text-sm font-medium">Enter your phone and PIN</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm font-bold"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          {/* Phone */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-white/40 px-1 block">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="080 0000 0000"
                className="w-full pl-14 pr-5 py-5 rounded-2xl bg-white/5 border-2 border-white/10 text-white text-lg font-bold placeholder-white/20 outline-none focus:border-primary/60 transition-all"
              />
            </div>
          </div>

          {/* PIN */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-white/40 px-1 block">
              4-Digit PIN
            </label>
            <div className="relative">
              <Lock size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full pl-14 pr-5 py-5 rounded-2xl bg-white/5 border-2 border-white/10 text-white text-2xl font-black tracking-[0.5em] placeholder-white/20 outline-none focus:border-primary/60 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-brand-navy py-5 rounded-2xl text-lg font-black shadow-yellow hover:bg-primary-dim active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={22} />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-white/30 font-bold uppercase tracking-widest">
          BuildHub Worker Portal
        </p>
      </motion.div>
    </div>
  );
};

export default WorkerLogin;
