import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Globe, BarChart3, CheckCircle2, PlayCircle, Layers, Fingerprint } from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';

const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -8, scale: 1.02 }}
    className="relative p-8 rounded-[2.5rem] bg-white border border-gray-200 hover:border-primary/50 overflow-hidden group transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-primary/10"
  >
    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary text-primary group-hover:text-white transition-colors duration-500">
      <Icon size={28} className="transform group-hover:scale-110 transition-transform duration-500" />
    </div>
    <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">{title}</h3>
    <p className="text-gray-500 leading-relaxed font-medium text-sm z-10 relative">{desc}</p>
  </motion.div>
);

const Landing = () => (
  <div className="min-h-screen bg-white text-gray-900 selection:bg-primary selection:text-white overflow-hidden font-inter">
    <PublicNavbar />

    {/* HERO SECTION */}
    <section className="relative pt-40 sm:pt-56 pb-32 px-6 flex flex-col items-center text-center bg-white">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-5xl mx-auto w-full z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-[0.2em] mb-10"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          The New Standard For Construction
        </motion.div>

        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter mb-8 leading-[1.05]">
          Build With <br className="hidden sm:block" />
          <span className="text-primary">Absolute Precision.</span>
        </h1>

        <p className="text-xl sm:text-2xl text-gray-500 mb-14 max-w-3xl mx-auto font-medium leading-relaxed">
          From intelligent BOQs and Escrow-secured payments to real-time Marketplace sourcing. Run your entire construction operation from one <span className="text-gray-900 font-bold">powerful OS</span>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link to="/register" className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-primary text-white px-12 py-5 rounded-[2rem] font-black text-lg shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all duration-300">
            <span>Start Building Free</span>
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="group w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-[2rem] hover:bg-gray-100 hover:border-gray-300 transition-all duration-300">
            <PlayCircle size={24} className="text-primary group-hover:scale-110 transition-transform" /> Watch the Film
          </button>
        </div>
      </motion.div>
    </section>

    {/* DASHBOARD PREVIEW MOCKUP */}
    <section className="relative px-6 pb-32 bg-white">
      <motion.div 
        initial={{ opacity: 0, y: 100 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="max-w-6xl mx-auto relative z-20"
      >
        <div className="p-2 sm:p-4 rounded-[2rem] sm:rounded-[3rem] bg-gray-50 border border-gray-100 shadow-2xl overflow-hidden">
          <div className="w-full aspect-[16/9] rounded-[1.5rem] sm:rounded-[2.5rem] bg-white border border-gray-200 flex relative overflow-hidden shadow-inner text-left">
            {/* Sidebar Mockup */}
            <div className="hidden sm:flex flex-col w-48 bg-gray-50 border-r border-gray-200 p-4 shrink-0">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-6 h-6 bg-primary rounded bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-black text-primary">CP</span>
                </div>
                <div className="h-3 w-16 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-8 rounded-lg flex items-center px-3 ${i === 1 ? 'bg-primary/10' : ''}`}>
                    <div className={`w-4 h-4 rounded shrink-0 mr-3 ${i === 1 ? 'bg-primary/50' : 'bg-gray-300'}`}></div>
                    <div className={`h-2 w-full rounded ${i === 1 ? 'bg-primary/50' : 'bg-gray-200'}`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content Mockup */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {/* Header Mockup */}
              <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
                <div className="w-32 h-3 bg-gray-200 rounded-full"></div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20"></div>
                </div>
              </div>

              {/* Dashboard Content Mockup */}
              <div className="p-6 overflow-hidden flex-1 flex flex-col gap-6 opacity-80 hover:opacity-100 transition-opacity duration-500">
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                  {[
                    { val: '$2.4M', label: 'Total BOQ Value', color: 'bg-primary/10 text-primary' },
                    { val: '12', label: 'Active Projects', color: 'bg-blue-100 text-blue-600' },
                    { val: '98%', label: 'Verification Rate', color: 'bg-emerald-100 text-emerald-600' },
                    { val: '45', label: 'Marketplace Orders', color: 'bg-amber-100 text-amber-600' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                        <div className="w-4 h-4 bg-current rounded-sm opacity-50"></div>
                      </div>
                      <div className="font-black text-gray-900">{stat.val}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Charts & Lists Row */}
                <div className="flex gap-6 flex-1 min-h-0">
                  {/* Chart Area */}
                  <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-5 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-3 w-24 bg-gray-300 rounded"></div>
                      <div className="h-3 w-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex-1 flex items-end gap-2 px-2">
                      {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group cursor-pointer hover:bg-primary transition-colors" style={{ height: `${h}%` }}>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-8 h-4 bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* List Area */}
                  <div className="w-1/3 bg-gray-50 border border-gray-100 rounded-xl p-5 hidden lg:flex flex-col gap-4">
                    <div className="h-3 w-20 bg-gray-300 rounded mb-2"></div>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0"></div>
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2 w-full bg-gray-300 rounded"></div>
                          <div className="h-2 w-2/3 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>

    {/* FEATURES */}
    <section className="py-32 px-6 bg-gray-50 relative border-t border-gray-200">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight mb-6">Engineered for Scale.</h2>
          <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto">Everything you need to modernize your construction firm, packed into an incredibly intuitive interface.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard delay={0.1} icon={Zap} title="AI-Powered BOQs" desc="Generate ultra-precise Bill of Quantities using advanced AI and real-time marketplace pricing data. Eliminate estimation errors." />
          <FeatureCard delay={0.2} icon={ShieldCheck} title="Escrow Protection" desc="Secure payments built-in. Funds are held in escrow and released only when project milestones are verified and approved." />
          <FeatureCard delay={0.3} icon={Layers} title="Project Pulse" desc="Track budgets, milestones, and daily field reports in real-time. Full oversight of all your active construction sites." />
          <FeatureCard delay={0.4} icon={Globe} title="Global Directory" desc="Get found by top clients. Your professional profile acts as a verified digital storefront for your business." />
          <FeatureCard delay={0.5} icon={Fingerprint} title="Smart Contracts" desc="Digitally sign and enforce binding agreements directly on the platform with military-grade encryption." />
          <FeatureCard delay={0.6} icon={BarChart3} title="Deep Analytics" desc="Gain actionable insights into your spending, supply chain efficiency, and overall business growth." />
        </div>
      </div>
    </section>

    {/* SOCIAL PROOF & STATS */}
    <section className="py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-[4rem] bg-gray-50 border border-gray-200 p-12 sm:p-20 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4 text-gray-900">
            <BarChart3 size={600} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div>
              <h2 className="text-5xl sm:text-6xl font-black text-gray-900 mb-10 leading-[1.1] tracking-tight">The Backbone of <br/><span className="text-primary">African Infrastructure.</span></h2>
              <div className="space-y-8">
                {[
                  { title: "15k+ Verified Contractors", desc: "Trusted by the biggest names in construction." },
                  { title: "$500M+ Processed", desc: "Securely managed through our escrow engine." },
                  { title: "3M+ Materials Listed", desc: "The largest digital marketplace for heavy materials." }
                ].map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 * idx }}
                    key={item.title} className="flex gap-6 group"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                      <CheckCircle2 size={24} className="text-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-gray-500 font-medium">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="bg-white border border-gray-200 p-10 sm:p-14 rounded-[3rem] shadow-xl relative"
            >
              <div className="absolute -top-6 -left-6 text-primary opacity-20">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-8 italic leading-snug">"Cpromark transformed our entire workflow. We saved 30% on material costs during our last $5M residential project."</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center font-black text-xl text-primary">V</div>
                <div>
                  <p className="text-gray-900 font-black text-lg">Vertex Builders Ltd</p>
                  <p className="text-primary font-bold text-sm uppercase tracking-widest">Enterprise Partner</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-40 text-center px-6 relative bg-primary text-white">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-6xl sm:text-7xl font-black tracking-tighter mb-10">Step into the future.</h2>
        <Link to="/register" className="inline-flex items-center gap-4 bg-white text-primary px-16 py-6 rounded-[3rem] font-black text-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          Initialize Office <ArrowRight size={28} />
        </Link>
      </motion.div>
    </section>

    <PublicFooter />
  </div>
);

export default Landing;
