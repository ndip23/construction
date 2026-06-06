import { PublicNavbar } from '../components/layout/PublicNavbar';
import { PublicFooter } from '../components/layout/PublicFooter';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-card text-foreground">
      <PublicNavbar />
      
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
           
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
               Get in <span className="text-primary">Touch</span>
             </h1>
             <p className="text-lg text-muted-foreground font-medium mb-12 max-w-md">
               Whether you're looking to upgrade your enterprise plan or need technical support, our team is here to help.
             </p>

             <div className="space-y-8">
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-foreground shrink-0">
                      <Mail size={20} />
                   </div>
                   <div>
                      <h4 className="font-bold text-foreground mb-1">Email Us</h4>
                      <p className="text-sm text-muted-foreground font-medium">support@cpromark.com</p>
                   </div>
                </div>
                
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-foreground shrink-0">
                      <Phone size={20} />
                   </div>
                   <div>
                      <h4 className="font-bold text-foreground mb-1">Call Us</h4>
                      <p className="text-sm text-muted-foreground font-medium">+1 (800) 123-4567</p>
                   </div>
                </div>

                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-foreground shrink-0">
                      <MapPin size={20} />
                   </div>
                   <div>
                      <h4 className="font-bold text-foreground mb-1">Global HQ</h4>
                      <p className="text-sm text-muted-foreground font-medium">100 Construction Way<br/>New York, NY 10001</p>
                   </div>
                </div>
             </div>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }} 
             animate={{ opacity: 1, y: 0 }} 
             transition={{ delay: 0.2 }}
             className="bg-muted border border-border p-8 md:p-12 rounded-[2.5rem] shadow-sm"
           >
              <h3 className="text-2xl font-black mb-8 tracking-tight">Send a Message</h3>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name</label>
                       <input type="text" className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Last Name</label>
                       <input type="text" className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Doe" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Work Email</label>
                    <input type="email" className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="john@company.com" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                    <textarea rows={4} className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all resize-none" placeholder="How can we help you?"></textarea>
                 </div>
                 <button className="w-full bg-primary text-background font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    Send Message <Send size={18} />
                 </button>
              </form>
           </motion.div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Contact;
