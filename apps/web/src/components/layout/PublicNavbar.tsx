import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export const PublicNavbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-background/80 backdrop-blur-xl border border-border rounded-2xl px-6 py-3 shadow-card">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-black text-brand-navy text-xs italic">CP</div>
          <span className="font-black text-foreground text-base tracking-tight">Cpromark</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Directory', to: '/directory' },
            { label: 'Marketplace', to: '/marketplace' },
            { label: 'Post Tender', to: '/post-project' },
          ].map(l => (
            <Link key={l.to} to={l.to} className="text-foreground/60 hover:text-primary text-sm font-semibold transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="px-5 py-2.5 text-foreground/70 hover:text-foreground font-bold text-sm transition-colors">
            Log In
          </Link>
          <Link to="/register" className="px-5 py-2.5 bg-primary text-brand-navy rounded-xl font-black text-sm hover:bg-primary-dim transition-all shadow-yellow">
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground/60 hover:text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-2 bg-card border border-border rounded-2xl p-4 shadow-card mx-0">
          {[
            { label: 'Directory', to: '/directory' },
            { label: 'Marketplace', to: '/marketplace' },
            { label: 'Post Tender', to: '/post-project' },
            { label: 'Log In', to: '/login' },
          ].map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              className="block py-3 text-foreground/70 hover:text-primary font-semibold text-sm border-b border-border last:border-0 transition-colors">
              {l.label}
            </Link>
          ))}
          <Link to="/register" onClick={() => setOpen(false)}
            className="block mt-3 py-3 bg-primary text-brand-navy rounded-xl font-black text-sm text-center shadow-yellow">
            Get Started Free
          </Link>
        </div>
      )}
    </nav>
  );
};
