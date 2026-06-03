import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';
import apiClient from '../api/client';
import { ShieldCheck, MapPin, Star, Search, Loader2, Inbox, UserCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '../theme';

const CompanyCard = ({ company }: { company: any }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="bg-card rounded-[2rem] overflow-hidden shadow-sm border border-border flex flex-col h-full hover:border-primary/20 transition-all"
    >
      <div className="h-56 relative overflow-hidden bg-background flex items-center justify-center">
        {company.logo
          ? <img src={company.logo} className="w-full h-full object-cover transition-all duration-700 hover:scale-110" alt={company.name} />
          : <span className="text-7xl font-black text-foreground/20 italic">{company.name.charAt(0)}</span>
        }
        {company.status === 'verified' && (
          <div className="absolute bottom-4 left-4 bg-emerald-500 text-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <ShieldCheck size={14} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
          </div>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-black text-foreground tracking-tighter truncate capitalize">{company.name}</h3>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
            <Star size={12} fill="currentColor" />
            <span className="text-[10px] font-black">{company.rating || '5.0'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-6">
          <MapPin size={14} className="text-primary" />
          <span className="capitalize">{company.city}, {company.country}</span>
        </div>
<div className="mt-auto pt-6 border-t border-border flex items-center justify-between gap-3">
          <button
            onClick={handleContact}
            className="flex-1 bg-primary text-brand-navy py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare size={16} /> Message
          </Link>
          <Link
            to={`/company/${company.slug}`}
            className="flex-1 bg-muted text-foreground py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-border flex items-center justify-center gap-2 hover:bg-background hover:border-primary/20 transition-all"
          >
            <UserCircle size={16} /> View Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const PublicDirectory = () => {
  const [service, setService] = useState('');
  const [city, setCity] = useState('');
  const debouncedService = useDebounce(service, 400);
  const debouncedCity = useDebounce(city, 400);

  const { data: companies, isLoading, isFetching } = useQuery({
    queryKey: ['public-directory', debouncedService, debouncedCity],
    queryFn: async () => {
      const { data } = await apiClient.get('/explore/companies', {
        params: { service: debouncedService, city: debouncedCity },
      });
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />

      {/* CTA BANNER */}
      <section className="pt-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card border border-border rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-2xl text-center lg:text-left">
                <span className="bg-primary-pale text-primary px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                  For Project Owners
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter mt-4 mb-3 leading-tight">
                  Have a project? Get <span className="text-primary italic">Competitive Bids.</span>
                </h2>
                <p className="text-muted-foreground font-medium text-base">
                  Broadcast your project to our verified network of builders instantly.
                </p>
              </div>
              <Link
                to="/post-project"
                className="bg-background text-foreground px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-border hover:bg-primary hover:text-brand-navy hover:border-primary transition-all shrink-0"
              >
                Request Bids Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="pt-12 pb-10 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter mb-8 leading-[0.9]">
            Find Verified <span className="text-primary">Experts.</span>
          </h1>
          <div className="bg-card border border-border p-2 rounded-[3rem] shadow-sm flex flex-col md:flex-row items-center gap-2 max-w-4xl mx-auto focus-within:ring-2 focus-within:ring-primary/30 transition-all">
            <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full">
              <Search className={isFetching ? 'text-primary animate-pulse' : 'text-foreground/35'} size={22} />
              <input
                type="text"
                value={service}
                onChange={e => setService(e.target.value)}
                placeholder="Company Name or Service..."
                className="w-full outline-none font-bold text-foreground text-sm bg-transparent placeholder:text-foreground/35"
              />
            </div>
            <div className="hidden md:block w-px h-10 bg-brand-border" />
            <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full">
              <MapPin className="text-primary shrink-0" size={22} />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Filter by City..."
                className="w-full outline-none font-bold text-foreground text-sm bg-transparent placeholder:text-foreground/35"
              />
            </div>
            <div className="hidden md:flex px-8 text-[9px] font-black text-primary uppercase tracking-widest items-center gap-2">
              {isFetching
                ? <><Loader2 className="animate-spin" size={14} /> Searching</>
                : <><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Real-time</>
              }
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center">
              <Loader2 className="animate-spin text-primary mb-4" size={40} />
              <p className={t.label}>Syncing Directory...</p>
            </div>
          ) : !companies || companies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={t.emptyState + ' flex flex-col items-center'}
            >
              <Inbox className="text-foreground/15 mb-4" size={80} />
              <p className={t.label + ' italic'}>No experts found in this region.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {companies.map((c: any) => <CompanyCard key={c._id} company={c} />)}
            </div>
          )}
        </AnimatePresence>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicDirectory;
