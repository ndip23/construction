import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, PlayCircle, Wallet, 
  Calculator, FileText,  Users, HardHat
} from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';

const FeatureCard = ({ icon: Icon, title, desc, color }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="p-8 bg-white rounded-[3rem] border border-slate-100 hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
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
    <div className="min-h-screen bg-white overflow-hidden font-inter">
      <PublicNavbar />

      {/* 1. HERO SECTION */}
      <section className="pt-48 pb-20 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -z-10" />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
          <span className="px-5 py-2 bg-blue-50 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-8 inline-block border border-blue-100">
            For Builders, Architects & Engineers
          </span>
          <h1 className="text-5xl md:text-8xl font-black text-[#001529] tracking-tighter mb-8 leading-[0.9]">
            Get More Projects. <br/> Zero <span className="text-blue-600 italic">Ad Spend.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            The growth platform for African construction. showcase your services, attract new clients, and manage your entire office from $10.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register" className="w-full sm:w-auto bg-[#001529] text-white px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
              Create Company Account
              <ArrowRight size={18} />
            </Link>
            <button className="flex items-center gap-3 px-10 py-5 text-[#001529] font-black text-sm uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">
              <PlayCircle size={24} className="text-blue-600" />
              Watch the Film
            </button>
          </div>
        </motion.div>
      </section>

      {/* 2. THE PROBLEM / SOLUTION STRIP */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
                { t: "Referrals are slow", d: "Stop relying on word of mouth to grow your business." },
                { t: "Ads are expensive", d: "Stop paying for clicks that don't become customers." },
                { t: "Paperwork takes time", d: "Stop creating BOQs and receipts manually." }
            ].map((item, i) => (
                <div key={i} className="flex gap-4">
                    <CheckCircle2 className="text-blue-600 shrink-0" size={24} />
                    <div>
                        <h4 className="font-black text-[#001529] uppercase text-xs tracking-widest mb-1">{item.t}</h4>
                        <p className="text-sm text-slate-400 font-medium">{item.d}</p>
                    </div>
                </div>
            ))}
         </div>
      </section>

      {/* 3. HOW IT WORKS (THE 5 STEPS) */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-[#001529] tracking-tighter mb-4">How CproHub works.</h2>
            <p className="text-slate-400 font-medium">Simple steps to scale your construction firm.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
           {[
             { n: "01", t: "Register", d: "Create your business identity in minutes." },
             { n: "02", t: "Fund", d: "Deposit $10 via MoMo or Card to start." },
             { n: "03", t: "Showcase", d: "Build your digital material showroom." },
             { n: "04", t: "Receive", d: "Get client inquiries instantly on your phone." },
             { n: "05", t: "Grow", d: "Pay only when a client contacts you." },
           ].map((step, i) => (
             <div key={i} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                <span className="text-3xl font-black text-blue-600/20 mb-6 block italic">{step.n}</span>
                <h4 className="font-black text-[#001529] text-sm uppercase tracking-widest mb-3">{step.t}</h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">{step.d}</p>
             </div>
           ))}
        </div>
      </section>

      {/* 4. THE COMPLETE OPERATING SYSTEM (CORE FEATURES) */}
      <section className="py-32 px-6 bg-[#001529] rounded-[4rem] mx-6 mb-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 blur-[120px] rounded-full" />
        
        <div className="max-w-7xl mx-auto">
            <div className="mb-20">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 italic">More than a Marketplace.</h2>
                <p className="text-slate-400 font-medium max-w-xl">CproHub is a complete operating system built for professional construction entities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={FileText} 
                    color="bg-purple-600" 
                    title="Professional Receipts" 
                    desc="Stop manual billing. Generate branded receipts with QR verification in seconds." 
                />
                <FeatureCard 
                    icon={Calculator} 
                    color="bg-rose-500" 
                    title="BOQ Engine" 
                    desc="Calculate material and labor costs faster. Submit proposals with 100% confidence." 
                />
                <FeatureCard 
                    icon={Briefcase} 
                    color="bg-blue-600" 
                    title="Tender Discovery" 
                    desc="Automatically search for building contracts and engineering opportunities." 
                />
                <FeatureCard 
                    icon={HardHat} 
                    color="bg-amber-500" 
                    title="Project Management" 
                    desc="Track progress, materials, and deadlines from one centralized dashboard." 
                />
                <FeatureCard 
                    icon={Users} 
                    color="bg-emerald-600" 
                    title="Workforce Tracking" 
                    desc="Organize your technical team, monitor attendance, and assign tasks." 
                />
                <FeatureCard 
                    icon={Sparkles} 
                    color="bg-indigo-600" 
                    title="Construction AI" 
                    desc="Expert assistance for structural recommendations and cost analysis." 
                />
            </div>
        </div>
      </section>

      {/* 5. MONEY SECTION */}
      <section className="py-32 px-6 max-w-5xl mx-auto text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-10 shadow-xl">
            <Wallet size={40} />
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-[#001529] tracking-tighter mb-8 leading-tight">
            Pay Only for <span className="text-emerald-500 underline underline-offset-8">Results.</span>
        </h2>
        <p className="text-xl text-slate-500 mb-12 font-medium leading-relaxed">
            No contacts. No charges. Simple. <br/>
            Deposit funds via MoMo, Orange Money, M-Pesa, or Card and start growing today.
        </p>
        <Link to="/register" className="bg-[#001529] text-white px-16 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all inline-block">
            Start with Just $10
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Landing;