import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import apiClient from '../api/client';
import { 
  ShoppingBag, 
  Search, 
  Loader2, 
  Tag, 
  ArrowRight,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicFooter } from '../components/layout/PublicFooter';

const PublicMarketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. FETCH REAL MATERIALS FROM BACKEND
  const { data: products, isLoading } = useQuery({
    queryKey: ['public-marketplace'],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketplace/products');
      return data;
    }
  });

  // 2. CLIENT-SIDE SEARCH FILTER
  const filteredProducts = products?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-card relative overflow-hidden">
      <PublicNavbar />
      
      <main className="pt-32 px-6 max-w-7xl mx-auto pb-40 relative z-10">
        
        {/* MARKETPLACE HERO */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 bg-muted border border-border p-10 md:p-14 rounded-[3rem] shadow-sm">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center text-background shadow-lg">
                    <ShoppingBag size={22} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Direct Supply Chain</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter mb-6 leading-[1.1]">
                Construction <br /> 
                <span className="text-primary">Marketplace</span>
              </h1>
              <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">
                Source high-grade materials and heavy equipment directly from BuildHub verified suppliers. Instant procurement for your sites.
              </p>
            </motion.div>

            {/* SEARCH COMPONENT */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full md:w-[450px] relative group"
            >
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground" size={24} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search materials, tools..." 
                  className="w-full bg-card border border-border rounded-[2rem] py-6 pl-16 pr-8 shadow-sm outline-none text-foreground font-semibold focus:border-foreground transition-all text-lg" 
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* RESULTS GRID */}
        {isLoading ? (
          <div className="py-40 text-center flex flex-col items-center">
            <Loader2 className="animate-spin text-foreground mb-6" size={48} />
            <p className="font-black text-muted-foreground uppercase tracking-widest text-sm animate-pulse">Connecting to Suppliers...</p>
          </div>
        ) : filteredProducts?.length === 0 ? (
          <div className="text-center py-32 bg-muted rounded-[4rem] border border-border border-dashed">
             <Inbox className="mx-auto text-foreground/20 mb-6" size={72} />
             <h3 className="text-3xl font-black text-foreground tracking-tight">No Materials Found</h3>
             <p className="text-muted-foreground mt-3 font-medium text-lg">Try a different search term or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence>
              {filteredProducts?.map((p: any, idx: number) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.5, ease: "easeOut" }}
                  key={p._id} 
                  className="bg-card border border-border p-4 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                >
                  {p.ownerId ? (
                      <a 
                        onClick={() => {
                          apiClient.post('/marketplace/track', { 
                            action: 'whatsapp_click', 
                            region: 'Unknown', 
                            city: 'Unknown', 
                            metadata: { productId: p._id, productName: p.name, supplierId: p.ownerId, category: p.category } 
                          }).catch(console.error);
                        }}
                        href={`https://wa.me/${p.whatsappNumber || ''}?text=${encodeURIComponent(`Hello, I would like to purchase or get more information about your product: ${p.name} (Category: ${p.category}, Price: $${p.price} per ${p.unit}).`)}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="block relative z-10"
                      >
                        <div className="aspect-[4/3] bg-muted rounded-[2rem] overflow-hidden mb-6 relative border border-border/50">
                          <img 
                            src={p.image || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80"} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                            alt={p.name}
                          />
                          <div className="absolute top-4 left-4 bg-background px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-foreground shadow-sm border border-border">
                              {p.category}
                          </div>
                        </div>
                      </a>
                  ) : (
                    <div className="block relative z-10 opacity-70">
                      <div className="aspect-[4/3] bg-muted rounded-[2rem] overflow-hidden mb-6 relative border border-border/50">
                        <img 
                          src={p.image || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80"} 
                          className="w-full h-full object-cover grayscale" 
                          alt={p.name}
                        />
                        <div className="absolute top-4 left-4 bg-background/50 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-foreground shadow-sm border border-border">
                            {p.category}
                        </div>
                        <div className="absolute inset-0 bg-background/20 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="bg-background text-foreground px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-border shadow-md">Owner Unavailable</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="px-4 pb-4 relative z-10">
                     <div className="flex items-center gap-2 mb-3">
                        <Tag size={14} className="text-foreground/50" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{p.supplier}</p>
                     </div>
                     <h3 className="font-black text-foreground text-xl mb-6 leading-tight transition-colors">
                        {p.name}
                     </h3>
                     <div className="flex justify-between items-end border-t border-border pt-5">
                        <div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-widest">Price / {p.unit}</p>
                           <span className="text-3xl font-black text-foreground tracking-tighter">${p.price?.toLocaleString()}</span>
                        </div>
                        {p.ownerId ? (
                            <a 
                              onClick={() => {
                                apiClient.post('/marketplace/track', { 
                                  action: 'whatsapp_click', 
                                  region: 'Unknown', 
                                  city: 'Unknown', 
                                  metadata: { productId: p._id, productName: p.name, supplierId: p.ownerId, category: p.category } 
                                }).catch(console.error);
                              }}
                              href={`https://wa.me/${p.whatsappNumber || ''}?text=${encodeURIComponent(`Hello, I would like to purchase or get more information about your product: ${p.name} (Category: ${p.category}, Price: $${p.price} per ${p.unit}).`)}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="w-14 h-14 bg-foreground text-background flex items-center justify-center rounded-[1.25rem] shadow-sm hover:bg-primary hover:text-foreground transition-colors duration-300 group/btn"
                            >
                               <ShoppingBag size={22} />
                            </a>
                        ) : (
                          <div className="w-14 h-14 bg-muted text-muted-foreground flex items-center justify-center rounded-[1.25rem] shadow-sm cursor-not-allowed">
                             <ShoppingBag size={22} />
                          </div>
                        )}
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* BOTTOM PROMO */}
        <section className="mt-40 p-16 md:p-24 bg-foreground rounded-[4rem] relative overflow-hidden text-center text-background shadow-lg border border-foreground">
           <div className="absolute top-[-50%] left-[-20%] w-[1000px] h-[1000px] opacity-[0.03] pointer-events-none rotate-12">
             <TrendingUp className="w-full h-full" />
           </div>
           
           <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative z-10">
              <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tighter leading-tight">
                Building at <span className="text-primary">Scale?</span>
              </h2>
              <p className="text-background/80 mb-12 max-w-2xl mx-auto font-medium leading-relaxed text-lg">
                Connect with our dedicated Logistics team for bulk wholesale pricing, priority site delivery, and custom supply chain management.
              </p>
              <button className="bg-primary hover:bg-primary-dim text-foreground px-12 py-6 rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 mx-auto shadow-sm hover:shadow-md">
                 Request Enterprise Quote <ArrowRight size={20} />
              </button>
           </motion.div>
        </section>
      </main>
       <PublicFooter />
    </div>
  );
};

export default PublicMarketplace;