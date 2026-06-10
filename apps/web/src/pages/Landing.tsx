import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, 
  CheckCircle2,  Wallet, 
  Calculator, FileText,  Users, 
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
    <h3 className="text-xl font-black text-[#001529] mb-4 tracking-tight">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm font-medium">{desc}</p>
  </motion.div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-white overflow-hidden font-inter text-[#001529]">
      <PublicNavbar />

      {/* 1. HERO SECTION */}
      <section className="pt-48 pb-32 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -z-10" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            Get More Projects Without <br/> <span className="text-blue-600 italic">Expensive Ads.</span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-500 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            The growth platform for Contractors, Engineers, and Architects. Showcase your services, attract clients, and manage your entire office from just <span className="text-[#001529] font-black">$10.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register" className="w-full sm:w-auto bg-[#001529] text-white px-12 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
              Create Your Company Account
              <ArrowRight size={18} />
            </Link>
            <div className="flex items-center gap-3 px-8 py-5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <Wallet size={20} />
                <span className="text-xs font-black uppercase tracking-widest text-center">Pay Only When Clients Contact You</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. THE CHALLENGE SECTION */}
      <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-8">Stop Waiting for <span className="text-blue-600">Referrals.</span></h2>
                <div className="space-y-6">
                    {[
                        "Finding construction projects is difficult.",
                        "Managing workers is difficult.",
                        "Paperwork (BOQs, Receipts) consumes your time.",
                        "Word-of-mouth is not enough to scale."
                    ].map((text, i) => (
                        <div key={i} className="flex gap-4 items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <X className="text-rose-500" size={20} />
                            <p className="font-bold text-slate-600 text-sm">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-[#001529] p-12 rounded-[4rem] text-white shadow-2xl">
                <h3 className="text-3xl font-black mb-6 italic underline decoration-blue-600 underline-offset-8">The Cprohub Solution</h3>
                <p className="text-slate-400 font-medium leading-relaxed mb-8">
                    Cprohub brings everything together in one platform. Create your profile, showcase services, and use AI tools designed specifically for construction professionals.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    {['Manage Projects', 'Generate BOQs', 'Attract Clients', 'AI Site Support'].map(item => (
                        <div key={item} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
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
            <p className="text-slate-400 font-medium uppercase tracking-[0.3em] text-xs">A Simple 5-Step Process to Results</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
           {[
             { n: "01", t: "Register", d: "Add company info, portfolio, certifications and contacts." },
             { n: "02", t: "Fund", d: "Deposit $10 via MoMo (MTN/Orange), M-Pesa or Card." },
             { n: "03", t: "Showcase", d: "List services like Civil, Electrical, Plumbing or Architecture." },
             { n: "04", t: "Receive", d: "Get high-value client inquiries instantly on your dashboard." },
             { n: "05", t: "Pay", d: "Only pay a small fee when a real client contacts you." },
           ].map((step, i) => (
             <div key={i} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-600 transition-all">
                <span className="text-5xl font-black text-slate-50 mb-6 block italic group-hover:text-blue-50 transition-colors">{step.n}</span>
                <h4 className="font-black text-[#001529] text-sm uppercase tracking-widest mb-4">{step.t}</h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">{step.d}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 4. OPERATING SYSTEM (DETAILED FEATURES) */}
      <section className="py-32 px-6 bg-[#001529] rounded-[4rem] mx-6 mb-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px] rounded-full" />
        
        <div className="max-w-7xl mx-auto">
            <header className="mb-24 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-12">
                <div className="max-w-2xl">
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 italic leading-tight">More than a Marketplace.</h2>
                    <p className="text-slate-400 font-medium text-lg">A complete operating system for modern construction companies.</p>
                </div>
                <ShieldCheck size={80} className="text-blue-600 opacity-20" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={FileText} 
                    color="bg-purple-600" 
                    title="Professional Receipts" 
                    desc="Description work and auto-generate receipts with Logo, QR verification, and Branding in seconds." 
                />
                <FeatureCard 
                    icon={Calculator} 
                    color="bg-rose-500" 
                    title="Faster BOQs" 
                    desc="Generate Bills of Quantities, calculate material/labour costs, and track project expenses instantly." 
                />
                <FeatureCard 
                    icon={Search} 
                    color="bg-blue-600" 
                    title="Job Discovery" 
                    desc="Automatically search for Tenders, Building Contracts, and Procurement requests without searching." 
                />
                <FeatureCard 
                    icon={LayoutDashboard} 
                    color="bg-amber-500" 
                    title="Project Monitor" 
                    desc="Monitor progress, budgets, site activities, and team performance from one central dashboard." 
                />
                <FeatureCard 
                    icon={Users} 
                    color="bg-emerald-600" 
                    title="Worker HR" 
                    desc="Track workers, assign tasks, and monitor attendance to keep operations running smoothly." 
                />
                <FeatureCard 
                    icon={BrainCircuit} 
                    color="bg-indigo-600" 
                    title="Construction AI" 
                    desc="Expert assistant for material estimation, structural recommendations, and documentation prep." 
                />
            </div>

            {/* SECONDARY REVENUE: MATERIAL SALES */}
            <div className="mt-20 p-12 bg-white/5 rounded-[4rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <Package className="text-blue-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Inventory Stream</h4>
                    </div>
                    <h3 className="text-3xl font-black mb-4">Sell Materials Directly.</h3>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed">
                        List products like Cement, Sand, Gravel, and Iron Rods on Cprohub. Generate an additional revenue stream from buyers looking for supplies.
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
            <h2 className="text-5xl font-black tracking-tighter mb-10 leading-[0.9]">Why Professionals Choose <br/> <span className="text-blue-600 italic">Cprohub.</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    "More Client Inquiries", "Better Visibility", "Faster BOQ Creation", 
                    "AI Site Assistant", "Project Opportunities", "Pay Only for Results",
                    "Attendance Tracking", "QR Verified Receipts", "Material Marketplace"
                ].map(item => (
                    <div key={item} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        <span className="text-xs font-black uppercase text-[#001529] tracking-tight">{item}</span>
                    </div>
                ))}
            </div>
         </div>
         <div className="bg-emerald-50 rounded-[4rem] p-12 flex flex-col justify-center text-center">
             <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl">
                 <Landmark size={40} />
             </div>
             <h3 className="text-4xl font-black text-emerald-950 mb-6 tracking-tighter italic">Risk-Free Growth.</h3>
             <p className="text-emerald-800 font-medium text-lg leading-relaxed mb-10">
                Unlike traditional advertising, you are only charged when someone contacts your business. No contacts. No charges. Simple.
             </p>
             <button className="bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700">Explore Pricing Logic</button>
         </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-40 text-center px-6">
        <h2 className="text-5xl md:text-8xl font-black tracking-[ -0.05em] mb-12 leading-none">
            Grow Your Business <br/> with <span className="text-blue-600 underline decoration-8 underline-offset-12">Confidence.</span>
        </h2>
        <div className="flex flex-col items-center gap-8">
            <Link to="/register" className="bg-[#001529] text-white px-16 py-7 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-700 hover:scale-105 transition-all">
                Create Your Account Now
            </Link>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
                Start with just $10 • Pay Only for Results
            </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Landing;