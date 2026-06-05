import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';
import { motion } from 'framer-motion';
import { Building2, ShieldCheck, Globe, Users } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-card text-foreground">
      <PublicNavbar />
      
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full mb-6">
             <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Our Story</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
            Building the future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dim">Construction</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Cpromark is the premier platform connecting contractors, suppliers, and engineering professionals across the globe. We streamline operations from the ground up.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
           {[
             { icon: Building2, title: "10,000+", desc: "Projects Completed" },
             { icon: Users, title: "50,000+", desc: "Verified Professionals" },
             { icon: Globe, title: "12", desc: "Countries Operated" },
             { icon: ShieldCheck, title: "100%", desc: "Secure Transactions" }
           ].map((stat, idx) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.1 }}
               className="bg-muted border border-border p-8 rounded-[2rem] text-center"
             >
                <stat.icon size={40} className="mx-auto text-primary mb-6" />
                <h3 className="text-4xl font-black text-foreground tracking-tighter mb-2">{stat.title}</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.desc}</p>
             </motion.div>
           ))}
        </div>

        <section className="bg-foreground text-background rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
           <div className="absolute top-[-50%] right-[-10%] w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
           <div className="relative z-10 max-w-3xl">
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Our Mission</h2>
              <p className="text-lg text-background/80 font-medium leading-relaxed mb-6">
                We believe that construction shouldn't be hampered by fragmented supply chains and archaic procurement processes. Our mission is to digitalize the construction sector, making it efficient, transparent, and highly scalable.
              </p>
              <p className="text-lg text-background/80 font-medium leading-relaxed">
                By bringing project management, material sourcing, and talent acquisition into a single, unified dashboard, we empower builders to focus on what they do best: building the world of tomorrow.
              </p>
           </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default About;
