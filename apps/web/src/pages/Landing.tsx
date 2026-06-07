import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, Zap, Globe, BarChart3, 
  CheckCircle2, PlayCircle, Layers, Fingerprint 
} from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';

// Optimized Feature Card for all screens
const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-20px" }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5 }}
    className="relative p-6 sm:p-8 rounded-[2rem] bg-white border border-gray-100 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl group"
  >
    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary text-primary group-hover:text-white transition-colors duration-500">
      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
    </div>
    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-500 leading-relaxed text-sm sm:text-base font-medium">{desc}</p>
  </motion.div>
);

const Landing = () => (
  <div className="min-h-screen bg-white text-gray-900 selection:bg-primary selection:text-white overflow-x-hidden font-inter">
    <PublicNavbar />

    {/* HERO SECTION */}
    <section className="relative pt-32 sm:pt-48 lg:pt-56 pb-16 sm:pb-32 px-4 sm:px-6 flex flex-col items-center text-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }} 
        className="max-w-5xl mx-auto w-full"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          The New Standard For Construction
        </motion.div>

        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-gray-900 tracking-tighter mb-6 leading-[1.1]">
          Build With <br className="hidden sm:block" />
          <span className="text-primary">Absolute Precision.</span>
        </h1>

        <p className="text-base sm:text-xl lg:text-2xl text-gray-500 mb-10 max-w-3xl mx-auto font-medium leading-relaxed px-4">
          Intelligent BOQs, Escrow-secured payments, and real-time Marketplace sourcing. Run your entire construction operation from one <span className="text-gray-900 font-bold">powerful OS</span>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4">
          <Link to="/register" className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-primary text-white px-8 lg:px-12 py-4 lg:py-5 rounded-2xl lg:rounded-[2rem] font-black text-base lg:text-lg shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300">
            <span>Start Building Free</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 lg:px-12 py-4 lg:py-5 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-2xl lg:rounded-[2rem] hover:bg-gray-100 transition-all duration-300">
            <PlayCircle size={22} className="text-primary" /> Watch the Film
          </button>
        </div>
      </motion.div>
    </section>

    {/* DASHBOARD PREVIEW MOCKUP */}
    <section className="px-4 sm:px-6 pb-20 sm:pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto"
      >
        <div className="p-1 sm:p-4 rounded-[1.5rem] sm:rounded-[3rem] bg-gray-100 border border-gray-200 shadow-2xl overflow-hidden">
          <div className="w-full aspect-[4/3] sm:aspect-[16/9] rounded-[1rem] sm:rounded-[2.5rem] bg-white border border-gray-200 flex relative overflow-hidden shadow-inner">
            
            {/* Sidebar Mockup - Hidden on Mobile */}
            <div className="hidden md:flex flex-col w-48 lg:w-56 bg-gray-50 border-r border-gray-200 p-6 shrink-0">
              <div className="w-10 h-10 bg-primary/20 rounded-xl mb-10 flex items-center justify-center">
                <div className="w-5 h-5 bg-primary rounded-sm opacity-60" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-10 rounded-xl flex items-center px-4 ${i === 1 ? 'bg-primary/10' : ''}`}>
                    <div className={`w-4 h-4 rounded shrink-0 mr-3 ${i === 1 ? 'bg-primary/40' : 'bg-gray-300'}`} />
                    <div className="h-2 w-full bg-gray-200 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Mockup */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              <div className="h-14 sm:h-20 border-b border-gray-100 flex items-center justify-between px-4 sm:px-10 shrink-0">
                <div className="w-24 sm:w-40 h-3 bg-gray-100 rounded-full" />
                <div className="flex gap-2 sm:gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-50" />
                  <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10" />
                </div>
              </div>

              <div className="p-4 sm:p-8 flex flex-col gap-4 sm:gap-8 flex-1 overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-50 p-3 sm:p-5 rounded-2xl border border-gray-100">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-lg mb-3" />
                      <div className="h-3 sm:h-4 w-1/2 bg-gray-900 rounded-full mb-2" />
                      <div className="h-2 w-1/3 bg-gray-300 rounded-full" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-100 p-4 sm:p-8 relative">
                   <div className="flex gap-2 h-full items-end pb-4">
                     {[40, 70, 45, 90, 65, 85, 100, 60, 30, 80].map((h, i) => (
                       <div key={i} className="flex-1 bg-primary/20 rounded-t-md" style={{ height: `${h}%` }} />
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>

    {/* FEATURES GRID */}
    <section className="py-24 sm:py-32 px-4 sm:px-6 bg-gray-50 relative border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-20 px-4">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-6">Engineered for Scale.</h2>
          <p className="text-gray-500 text-base sm:text-xl font-medium max-w-2xl mx-auto">Everything you need to modernize your construction firm, packed into an intuitive interface.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <FeatureCard delay={0.1} icon={Zap} title="AI-Powered BOQs" desc="Generate precise Bill of Quantities using AI and real-time marketplace data. Eliminate errors." />
          <FeatureCard delay={0.15} icon={ShieldCheck} title="Escrow Protection" desc="Funds are held securely and released only when project milestones are verified." />
          <FeatureCard delay={0.2} icon={Layers} title="Project Pulse" desc="Track budgets, milestones, and field reports in real-time. Full oversight on the go." />
          <FeatureCard delay={0.25} icon={Globe} title="Global Directory" desc="Get found by top clients. Your professional profile acts as a verified digital storefront." />
          <FeatureCard delay={0.3} icon={Fingerprint} title="Smart Contracts" desc="Digitally sign and enforce agreements with military-grade encryption." />
          <FeatureCard delay={0.35} icon={BarChart3} title="Deep Analytics" desc="Gain actionable insights into spending, efficiency, and overall business growth." />
        </div>
      </div>
    </section>

    {/* TESTIMONIAL/STATS SECTION */}
    <section className="py-24 sm:py-32 px-4 sm:px-6 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[2.5rem] sm:rounded-[4rem] bg-gray-900 text-white p-8 sm:p-16 lg:p-24 relative overflow-hidden">
          {/* Background Decorative Icon */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/3 translate-y-1/3 scale-150">
            <BarChart3 size={400} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
            <div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-10 leading-tight tracking-tight">The Backbone of <br/><span className="text-primary">Modern Industry.</span></h2>
              <div className="space-y-8">
                {[
                  { title: "15k+ Verified Contractors", desc: "Trusted by the biggest names." },
                  { title: "$500M+ Processed", desc: "Managed through our escrow engine." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 sm:gap-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl sm:text-2xl font-bold mb-1">{item.title}</h4>
                      <p className="text-gray-400 text-sm sm:text-base">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-2xl"
            >
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-medium italic mb-8 leading-snug">"Cpromark transformed our entire workflow. We saved 30% on material costs during our last project."</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-black text-lg">V</div>
                <div>
                  <p className="font-black text-lg sm:text-xl">Vertex Builders Ltd</p>
                  <p className="text-primary font-bold text-xs sm:text-sm uppercase tracking-widest">Enterprise Partner</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>

    {/* FINAL CTA */}
    <section className="py-32 sm:py-48 px-4 sm:px-6 text-center bg-primary">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        whileInView={{ opacity: 1, scale: 1 }} 
        viewport={{ once: true }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white tracking-tighter mb-10 leading-tight px-4">Step into the future.</h2>
        <Link to="/register" className="inline-flex items-center gap-3 bg-white text-primary px-10 sm:px-16 py-5 sm:py-7 rounded-2xl sm:rounded-[3rem] font-black text-xl sm:text-2xl shadow-2xl hover:bg-gray-50 hover:-translate-y-1 transition-all duration-300">
          Initialize Office <ArrowRight size={24} />
        </Link>
      </motion.div>
    </section>

    <PublicFooter />
  </div>
);

export default Landing;