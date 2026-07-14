import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calculator, Search, MapPin, ShieldCheck, Award, Tag, Smile,
  Star, ChevronRight, Menu, FileText, Users, ShoppingCart
} from 'lucide-react';
import { PublicFooter } from '../components/layout/PublicFooter';
import { PublicBottomNav } from '../components/layout/PublicBottomNav';
import { usePWA } from '../components/PWAProvider';

export default function Landing() {
  const navigate = useNavigate();
  const { setShowPopup } = usePWA();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [setShowPopup]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !locationQuery.trim()) return;

    const lowerQuery = searchQuery.toLowerCase();
    const isMaterial = ['cement', 'sand', 'gravel', 'steel', 'brick', 'wood', 'paint', 'material', 'stone'].some(term => lowerQuery.includes(term));

    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.append(isMaterial ? 'search' : 'service', searchQuery.trim());
    }
    if (locationQuery.trim()) {
      params.append('location', locationQuery.trim());
    }

    if (isMaterial) {
      navigate(`/marketplace?${params.toString()}`);
    } else {
      navigate(`/directory?${params.toString()}`);
    }
  };


  return (
    <div className="min-h-screen bg-[#FAFAFA] text-brand-navy font-inter pb-20 md:pb-0">

      {/* ─── HEADER/NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/cpromark-logo.png" alt="Cpromark Logo" className="w-8 h-8 object-contain rounded-lg" />
            <span className="font-black text-lg tracking-tight uppercase text-brand-navy">Cpromark</span>
          </Link>

          {/* Right Hamburger */}
          <button className="text-brand-navy">
            <Menu size={23} />
          </button>
        </div>
      </nav>

      {/* ─── HERO SECTION (BLENDED BACKGROUND) ─── */}
      <section className="relative pt-20 h-[480px] sm:h-[600px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/house_under_construction.png')` }}
        />

        {/* Soft white gradient overlays to blend the text nicely */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent hidden md:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent/30 md:hidden" />

        {/* Content Area */}
        <div className="relative z-10 max-w-7xl mx-auto h-full px-6 flex flex-col justify-center pb-20 sm:pb-32">
          <div className="max-w-xl space-y-4">
            <h1 className="text-[32px] sm:text-6xl font-black tracking-tight text-brand-navy leading-[1.1] md:leading-none">
              Your Construction Project, Simplified
            </h1>
            <p className="text-slate-700 text-sm sm:text-lg font-bold leading-relaxed max-w-md">
              Estimate costs, find trusted professionals, and buy quality materials — all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM SHEET SLIDING OVER HERO ─── */}
      <div className="relative z-20 -mt-24 sm:-mt-32 bg-white rounded-t-[2.5rem] border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pt-8 pb-16">

        {/* ─── 3 ACTION CARDS (EXACTLY ON THE SAME ROW) ─── */}
        <section className="px-4 sm:px-6 max-w-7xl mx-auto mb-10">
          <div className="grid grid-cols-3 gap-2 sm:gap-6">

            {/* Card 1: Estimate Cost */}
            <div
              onClick={() => navigate('/estimator')}
              className="bg-[#FFFDF2] border border-[#FFEBA6]/40 rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 flex flex-col justify-between items-center text-center sm:text-left min-h-[220px] sm:min-h-[320px] cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 sm:w-14 sm:h-14 bg-[#FFF8D6] rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6">
                  <Calculator className="text-[#E2B93B] w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-[11px] sm:text-xl font-black text-brand-navy mb-1 sm:mb-3 leading-tight">
                  Estimate Project Cost
                </h3>
                <p className="text-[8px] sm:text-xs text-slate-400 font-bold leading-normal">
                  Calculate accurate cost estimates in minutes with AI.
                </p>
              </div>
              <button className="w-6 h-6 sm:w-10 sm:h-10 bg-primary text-brand-navy rounded-full flex items-center justify-center mt-3">
                <ChevronRight size={14} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Card 2: Find Contractor */}
            <div
              onClick={() => navigate('/directory')}
              className="bg-[#F7FAFF] border border-[#DCE8FF]/50 rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 flex flex-col justify-between items-center text-center sm:text-left min-h-[220px] sm:min-h-[320px] cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 sm:w-14 sm:h-14 bg-[#E8F1FF] rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6">
                  <Users className="text-[#1A56DB] w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-[11px] sm:text-xl font-black text-brand-navy mb-1 sm:mb-3 leading-tight">
                  Find a Contractor
                </h3>
                <p className="text-[8px] sm:text-xs text-slate-400 font-bold leading-normal">
                  Connect with verified and trusted professionals near you.
                </p>
              </div>
              <button className="w-6 h-6 sm:w-10 sm:h-10 bg-[#0F172A] text-white rounded-full flex items-center justify-center mt-3">
                <ChevronRight size={14} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Card 3: Buy Materials */}
            <div
              onClick={() => navigate('/marketplace')}
              className="bg-[#F4FCF6] border border-[#D5F5DC]/50 rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 flex flex-col justify-between items-center text-center sm:text-left min-h-[220px] sm:min-h-[320px] cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 sm:w-14 sm:h-14 bg-[#E3F8E9] rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6">
                  <ShoppingCart className="text-[#10B981] w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-[11px] sm:text-xl font-black text-brand-navy mb-1 sm:mb-3 leading-tight">
                  Buy Materials
                </h3>
                <p className="text-[8px] sm:text-xs text-slate-400 font-bold leading-normal">
                  Compare prices and buy quality materials near you.
                </p>
              </div>
              <button className="w-6 h-6 sm:w-10 sm:h-10 bg-[#10B981] text-white rounded-full flex items-center justify-center mt-3">
                <ChevronRight size={14} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ─── QUICK SEARCH ─── */}
        <section className="px-4 sm:px-6 max-w-7xl mx-auto mb-10">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-black text-brand-navy mb-1">Quick Search</h3>
              <p className="text-slate-400 font-bold text-xs">Search contractors, services or materials near you</p>
            </div>

            <form onSubmit={handleSearch} className="flex items-center bg-white border border-slate-200 rounded-full p-1.5 w-full shadow-sm max-w-2xl mx-auto">
              <div className="flex items-center gap-2 pl-3 flex-1 min-w-0">
                <Search className="text-slate-400 shrink-0 hidden sm:block" size={16} />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-brand-navy font-semibold placeholder:text-slate-400 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-1 px-3 border-l border-slate-200 shrink-0">
                <MapPin className="text-slate-400 shrink-0" size={14} />
                <input
                  type="text"
                  placeholder="Near me"
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  className="w-14 sm:w-20 bg-transparent border-none outline-none text-brand-navy font-semibold placeholder:text-slate-400 text-[10px] sm:text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-9 h-9 sm:w-11 sm:h-11 bg-brand-navy hover:bg-slate-800 text-white rounded-full flex items-center justify-center shrink-0 transition-all shadow-sm"
              >
                <Search size={16} />
              </button>
            </form>
          </div>
        </section>

        {/* ─── VALUE BADGES ─── */}
        <section className="px-4 sm:px-6 max-w-7xl mx-auto mb-10">
          <div className="grid grid-cols-4 gap-2 sm:gap-6 max-w-5xl mx-auto">

            <div className="flex flex-col items-center">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-[#F5F8FF] border border-[#E1E8F5] rounded-full flex items-center justify-center mb-2 shadow-[0_4px_12px_rgba(0,0,0,0.01)] shrink-0">
                <ShieldCheck size={18} className="text-brand-navy sm:w-5 sm:h-5" />
              </div>
              <p className="text-[8px] sm:text-xs font-black text-brand-navy leading-tight text-center max-w-[100px]">
                Trusted & Verified Professionals
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-[#F5F8FF] border border-[#E1E8F5] rounded-full flex items-center justify-center mb-2 shadow-[0_4px_12px_rgba(0,0,0,0.01)] shrink-0">
                <Award size={18} className="text-brand-navy sm:w-5 sm:h-5" />
              </div>
              <p className="text-[8px] sm:text-xs font-black text-brand-navy leading-tight text-center max-w-[100px]">
                Quality Materials at Best Prices
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-[#F5F8FF] border border-[#E1E8F5] rounded-full flex items-center justify-center mb-2 shadow-[0_4px_12px_rgba(0,0,0,0.01)] shrink-0">
                <Tag size={18} className="text-brand-navy sm:w-5 sm:h-5" />
              </div>
              <p className="text-[8px] sm:text-xs font-black text-brand-navy leading-tight text-center max-w-[100px]">
                Compare & Save More Money
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-[#F5F8FF] border border-[#E1E8F5] rounded-full flex items-center justify-center mb-2 shadow-[0_4px_12px_rgba(0,0,0,0.01)] shrink-0">
                <ShieldCheck size={18} className="text-brand-navy sm:w-5 sm:h-5" />
              </div>
              <p className="text-[8px] sm:text-xs font-black text-brand-navy leading-tight text-center max-w-[100px]">
                Safe, Secure & Reliable
              </p>
            </div>

          </div>
        </section>

        {/* ─── NAVY STAT BAR ─── */}
        <section className="px-4 sm:px-6 max-w-7xl mx-auto mb-10">
          <div className="bg-brand-navy rounded-[2rem] p-4 sm:p-8 text-white max-w-5xl mx-auto shadow-lg">
            <div className="grid grid-cols-4 divide-x divide-white/10">

              {/* Stat 1 */}
              <div className="flex items-center gap-1.5 sm:gap-4 justify-center px-1 sm:px-4">
                <Users size={16} className="text-[#E2B93B] sm:w-6 sm:h-6 shrink-0" />
                <div>
                  <h4 className="text-[10px] sm:text-xl font-black leading-tight">10,000+</h4>
                  <p className="text-[6px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">Verified Contractors</p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-1.5 sm:gap-4 justify-center px-1 sm:px-4">
                <ShoppingCart size={16} className="text-[#E2B93B] sm:w-6 sm:h-6 shrink-0" />
                <div>
                  <h4 className="text-[10px] sm:text-xl font-black leading-tight">15,000+</h4>
                  <p className="text-[6px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">Materials Listed</p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center gap-1.5 sm:gap-4 justify-center px-1 sm:px-4">
                <FileText size={16} className="text-[#E2B93B] sm:w-6 sm:h-6 shrink-0" />
                <div>
                  <h4 className="text-[10px] sm:text-xl font-black leading-tight">50,000+</h4>
                  <p className="text-[6px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">Estimates Generated</p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex items-center gap-1.5 sm:gap-4 justify-center px-1 sm:px-4">
                <Smile size={16} className="text-[#E2B93B] sm:w-6 sm:h-6 shrink-0" />
                <div>
                  <h4 className="text-[10px] sm:text-xl font-black leading-tight">20,000+</h4>
                  <p className="text-[6px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">Happy Customers</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── TESTIMONIAL TEASER & REVIEWS ─── */}
        <section className="px-4 sm:px-6 max-w-7xl mx-auto pb-12">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <h4 className="text-xl sm:text-2xl font-black text-brand-navy">What Our Users Say</h4>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-1">
                <div className="flex text-primary gap-0.5">
                  <Star size={12} fill="currentColor" className="text-primary" />
                  <Star size={12} fill="currentColor" className="text-primary" />
                  <Star size={12} fill="currentColor" className="text-primary" />
                  <Star size={12} fill="currentColor" className="text-primary" />
                  <Star size={12} fill="currentColor" className="text-primary" />
                </div>
                <span className="text-xs font-black text-slate-700">4.8/5</span>
              </div>
            </div>

            <Link to="/directory" className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline self-start sm:self-auto">
              See all reviews <ChevronRight size={14} />
            </Link>
          </div>

          {/* Reviews list (horizontal scroll on mobile, grid on desktop) */}
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory px-4 -mx-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible">
            {[
              {
                name: 'Alhaji Ibrahim',
                role: 'Mason & Contractor, Kumasi',
                color: 'bg-[#FFF8D6] text-[#E2B93B]',
                initials: 'AI',
                text: 'Cprohub has completely changed how I get clients. I registered my services and received 3 phone calls within the first week. The platform is transparent and pay-per-call pricing is extremely fair.'
              },
              {
                name: 'Kwame Mensah',
                role: 'Homeowner, Accra',
                color: 'bg-[#E8F1FF] text-[#1A56DB]',
                initials: 'KM',
                text: 'Using the AI Cost Estimator was a game changer for my project. It calculated the exact amount of cement, sand, and blocks I needed. Saved me thousands in wasted materials.'
              },
              {
                name: 'Chinedu Okafor',
                role: 'Materials Supplier, Lagos',
                color: 'bg-[#E3F8E9] text-[#10B981]',
                initials: 'CO',
                text: 'Listing our cement and steel products on Cprohub Marketplace has boosted our sales. Builders find us directly online, place their orders, and pay securely. Highly recommend it.'
              }
            ].map((rev, i) => (
              <div
                key={i}
                className="snap-center shrink-0 w-[280px] sm:w-auto bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex text-primary gap-0.5 mb-4">
                    <Star size={12} fill="currentColor" className="text-primary" />
                    <Star size={12} fill="currentColor" className="text-primary" />
                    <Star size={12} fill="currentColor" className="text-primary" />
                    <Star size={12} fill="currentColor" className="text-primary" />
                    <Star size={12} fill="currentColor" className="text-primary" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6">
                    "{rev.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${rev.color} rounded-full flex items-center justify-center font-black text-sm shrink-0`}>
                    {rev.initials}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-brand-navy">{rev.name}</h5>
                    <p className="text-[10px] font-bold text-slate-400">{rev.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <PublicFooter />
      </div>

      <PublicBottomNav />

    </div>
  );
}
