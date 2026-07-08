import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, 
  CheckCircle2, Wallet, 
  Calculator, FileText, Users, 
  Search, X,
  Package, LayoutDashboard, BrainCircuit, Landmark
} from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';

const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="p-8 bg-white rounded-[2.5rem] border border-slate-100 hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
  >
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
      <Icon size={28} className="text-white" />
    </div>
    <h3 className="text-xl font-black text-brand-navy mb-4 tracking-tight">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm font-medium">{desc}</p>
  </motion.div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden font-inter text-brand-navy">
      <PublicNavbar />

      {/* 1. HERO SECTION */}
      <section className="pt-48 pb-32 px-6 text-center relative">
        {/* Background glow using your primary yellow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-brand-yellow/5 blur-[120px] rounded-full -z-10" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            Get More Construction Jobs Without <br/> <span className="text-brand-yellow italic">Paying for Ads.</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-500 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            A simple way for Contractors, Engineers, and Builders to show their work, get direct phone calls from local clients, and manage their business for just <span className="text-brand-navy font-black">$10.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register" className="w-full sm:w-auto bg-brand-yellow text-brand-navy px-12 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-yellow hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
              Create Your Free Account
              <ArrowRight size={18} />
            </Link>
            <div className="flex items-center gap-3 px-8 py-5 bg-brand-yellow/10 text-brand-yellow rounded-full border border-brand-yellow/20">
                <Wallet size={20} />
                <span className="text-xs font-black uppercase tracking-widest text-center">Pay Only When Clients Call You</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. THE CHALLENGE SECTION */}
      <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-8">Stop Waiting for <span className="text-brand-yellow italic">Friends to Recommend You.</span></h2>
                <div className="space-y-6">
                    {[
                        "Finding new construction clients is hard.",
                        "Keeping track of workers is stressful.",
                        "Making cost estimates and receipts takes too much time.",
                        "Relying on word-of-mouth limits your business growth."
                    ].map((text, i) => (
                        <div key={i} className="flex gap-4 items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <X className="text-rose-500" size={20} />
                            <p className="font-bold text-slate-600 text-sm">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-brand-navy p-12 rounded-[4rem] text-white shadow-2xl">
                <h3 className="text-3xl font-black mb-6 italic underline decoration-brand-yellow underline-offset-8">The Cpromark Solution</h3>
                <p className="text-slate-400 font-medium leading-relaxed mb-8 text-lg">
                    Cpromark puts everything you need in one place. Create your profile, show off your past work, and use simple tools built to run your construction business.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    {['Organize Projects', 'Create Cost Estimates', 'Get Direct Clients', 'Easy Site Calculator'].map(item => (
                        <div key={item} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-yellow">
                            <CheckCircle2 size={16} /> {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (THE 5 STEPS) */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-4">How it works.</h2>
            <p className="text-slate-400 font-medium uppercase tracking-[0.3em] text-xs">Get Started in 5 Simple Steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
           {[
             { n: "01", t: "Create Account", d: "Add your phone number, list of services, and photos of your past work." },
             { n: "02", t: "Add $10", d: "Load $10 into your wallet using Mobile Money (MoMo), M-Pesa, or Card." },
             { n: "03", t: "Show Services", d: "List what you do, like building houses, wiring, plumbing, or drawing plans." },
             { n: "04", t: "Get Calls", d: "Get phone calls and messages directly from customers who need your services." },
             { n: "05", t: "Pay for Results", d: "We only charge a small fee when a real client actually contacts you." },
           ].map((step, i) => (
             <div key={i} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-yellow transition-all">
                <span className="text-5xl font-black text-slate-50 mb-6 block italic group-hover:text-brand-yellow/10 transition-colors">{step.n}</span>
                <h4 className="font-black text-brand-navy text-sm uppercase tracking-widest mb-4">{step.t}</h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">{step.d}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 4. OPERATING SYSTEM (DETAILED FEATURES) */}
      <section className="py-32 px-6 bg-brand-navy rounded-[4rem] mx-6 mb-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-yellow/5 blur-[120px] rounded-full" />
        
        <div className="max-w-7xl mx-auto">
            <header className="mb-24 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-12">
                <div className="max-w-2xl">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 italic leading-tight">Everything You Need to Run Your Business.</h2>
                    <p className="text-slate-400 font-medium text-lg">Powerful and simple tools built specifically for construction companies.</p>
                </div>
                <ShieldCheck size={80} className="text-brand-yellow opacity-20" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={FileText} 
                    color="bg-brand-yellow/80" 
                    title="Quick Receipts" 
                    desc="Type in your work details and make clean, printed receipts with your logo in just a few clicks." 
                />
                <FeatureCard 
                    icon={Calculator} 
                    color="bg-rose-500" 
                    title="Cost Estimator (BOQs)" 
                    desc="Make list of materials and labor costs, and see your profits instantly." 
                />
                <FeatureCard 
                    icon={Search} 
                    color="bg-sky-500" 
                    title="Find Projects" 
                    desc="See public tenders, government building contracts, and job requests in your area." 
                />
                <FeatureCard 
                    icon={LayoutDashboard} 
                    color="bg-brand-yellow" 
                    title="Track Your Site" 
                    desc="Keep track of work progress, project budgets, and what your team does each day." 
                />
                <FeatureCard 
                    icon={Users} 
                    color="bg-emerald-600" 
                    title="Manage Workers" 
                    desc="Keep a list of your workers, assign tasks, and check their daily attendance." 
                />
                <FeatureCard 
                    icon={BrainCircuit} 
                    color="bg-indigo-600" 
                    title="AI Assistant" 
                    desc="Ask our helper to calculate how much cement/sand you need or write business letters." 
                />
            </div>

            {/* MATERIAL SALES */}
            <div className="mt-20 p-12 bg-white/5 rounded-[4rem] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="max-w-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <Package className="text-brand-yellow" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-yellow">Sell Building Materials</h4>
                    </div>
                    <h3 className="text-3xl font-black mb-4">Sell Materials Directly.</h3>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed">
                        Sell items like Cement, Sand, Gravel, and Iron rods. Get extra customers who are already planning construction projects.
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {['Cement', 'Sand', 'Bricks', 'Steel', 'Zinc', 'Paint'].map(m => (
                        <div key={m} className="px-5 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">{m}</div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* 5. CHECKLIST SECTION */}
      <section className="py-32 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
         <div>
            <h2 className="text-5xl font-black tracking-tighter mb-10 leading-[0.9]">Why Professionals Choose <br/> <span className="text-brand-yellow italic">Cpromark.</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    "More Customer Calls", "Get Found Online", "Easy Cost Estimates", 
                    "Smart Site Assistant", "Access to Government Tenders", "Pay Only When Contacted",
                    "Worker Attendance Tracking", "Receipts with QR Codes", "Sell Sand & Cement"
                ].map(item => (
                    <div key={item} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        <span className="text-xs font-black uppercase text-brand-navy tracking-tight">{item}</span>
                    </div>
                ))}
            </div>
         </div>
         <div className="bg-brand-yellow/10 rounded-[4rem] p-12 flex flex-col justify-center text-center border border-brand-yellow/20">
             <div className="w-20 h-20 bg-brand-yellow rounded-3xl flex items-center justify-center text-brand-navy mx-auto mb-8 shadow-yellow">
                 <Landmark size={40} />
             </div>
             <h3 className="text-4xl font-black text-brand-navy mb-6 tracking-tighter italic">No Risk For You.</h3>
             <p className="text-slate-600 font-medium text-lg leading-relaxed mb-10">
                Unlike radio or poster ads, you only pay when a customer actually contacts you. If nobody calls, you pay nothing. Simple as that.
             </p>
             <button className="bg-brand-navy text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800">How Pricing Works</button>
         </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-40 text-center px-6">
        <h2 className="text-5xl md:text-8xl font-black tracking-[-0.05em] mb-12 leading-none">
            Start Getting More <br/> Construction <span className="text-brand-yellow underline decoration-8 underline-offset-[12px]">Work Today.</span>
        </h2>
        <div className="flex flex-col items-center gap-8">
            <Link to="/register" className="bg-brand-yellow text-brand-navy px-16 py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-yellow hover:scale-105 transition-all">
                Create Your Account Now
            </Link>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
                Start with only $10 • Pay only when clients call you
            </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Landing;