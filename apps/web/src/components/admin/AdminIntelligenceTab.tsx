import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  BarChart4, Target, Globe2, TrendingUp, TrendingDown,
  Server, ShieldAlert, ArrowUpRight, Search, PieChart,
  Lightbulb, MessagesSquare, Users, ShoppingCart, Box
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';

export const AdminIntelligenceTab = () => {
  const { data: intelligence, isLoading } = useQuery({
    queryKey: ['admin-marketplace-intelligence'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/admin/marketplace/intelligence', {
          skipErrorToast: true
        } as any);

        if (data._aiUnavailable) {
          toast.error('AI Intelligence is unavailable at the moment');
          const cached = localStorage.getItem('admin-marketplace-intelligence-cache');
          if (cached) {
            const parsedCache = JSON.parse(cached);
            // Merge fresh metrics into the cached AI data
            if (parsedCache.overview && data.overview) {
              parsedCache.overview = data.overview;
            }
            return parsedCache;
          }
          return data;
        }

        localStorage.setItem('admin-marketplace-intelligence-cache', JSON.stringify(data));
        return data;
      } catch (error: any) {
        toast.error('Gemini is unable at the moment');
        console.error('Gemini Error:', error?.response?.data || error.message);
        
        const cached = localStorage.getItem('admin-marketplace-intelligence-cache');
        if (cached) {
          return JSON.parse(cached);
        }
        
        return null;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative w-20 h-20">
           <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
           <Server className="absolute inset-0 m-auto text-emerald-500 animate-pulse" size={32} />
        </div>
        <p className="text-sm font-black text-emerald-600/70 uppercase tracking-widest animate-pulse">
          Aggregating Global Marketplace Data...
        </p>
      </div>
    );
  }

  if (!intelligence) {
    return <div className="text-center py-20 text-muted-foreground">No intelligence data available.</div>;
  }

  const { overview, demandIntelligence, growthOpportunities } = intelligence;

  return (
    <div className="space-y-8 pb-20 relative z-10 animate-in fade-in duration-500">
      
      {/* SECTION 1: GLOBAL MARKETPLACE OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
         {[
           { label: 'Suppliers', val: overview.totalSuppliers.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
           { label: 'Products', val: overview.totalProducts.toLocaleString(), icon: Box, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
           { label: 'Inquiries', val: overview.totalInquiries.toLocaleString(), icon: Search, color: 'text-amber-500', bg: 'bg-amber-500/10' },
           { label: 'RFQs', val: overview.totalRFQs.toLocaleString(), icon: ShoppingCart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
           { label: 'WhatsApp', val: overview.totalWhatsappClicks.toLocaleString(), icon: MessagesSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
           { label: 'Chats', val: overview.totalChatConversations.toLocaleString(), icon: MessagesSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
         ].map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: i * 0.05 }}
             className="bg-card border border-border p-5 rounded-[1.5rem] shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-md transition-all"
           >
             <div className={`p-3 rounded-xl mb-3 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
               <stat.icon size={20} />
             </div>
             <p className="text-2xl font-black text-foreground">{stat.val}</p>
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
           </motion.div>
         ))}
      </div>

      {/* SECTION 2: DEMAND INTELLIGENCE & SHORTAGES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fastest Growing / Declining */}
        <div className="bg-foreground text-background p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-5 group-hover:scale-110 transition-transform duration-700"><BarChart4 size={200} /></div>
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2 bg-background/10 rounded-lg text-background"><PieChart size={20} /></div>
            <h3 className="font-black text-sm uppercase tracking-widest">Demand Velocity</h3>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem]">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-2">
                <TrendingUp size={14} /> Fastest Growing Category
              </p>
              <h4 className="text-xl font-black text-background">{demandIntelligence.fastestGrowing}</h4>
            </div>

            <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem]">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2 flex items-center gap-2">
                <TrendingDown size={14} /> Fastest Declining Category
              </p>
              <h4 className="text-xl font-black text-background">{demandIntelligence.fastestDeclining}</h4>
            </div>
          </div>
        </div>

        {/* Regional Intelligence */}
        <div className="bg-card border border-border p-8 rounded-[2rem] shadow-sm relative overflow-hidden">
          <div className="absolute right-[-40px] top-[-40px] opacity-5"><Globe2 size={200} /></div>
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2 bg-muted rounded-lg text-foreground"><Target size={20} /></div>
            <h3 className="font-black text-sm uppercase tracking-widest">Regional Heatmap Intel</h3>
          </div>

          <div className="space-y-8 relative z-10">
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Highest Demand Regions</p>
               <div className="flex flex-wrap gap-2">
                 {demandIntelligence.highestDemandRegions.map((region: string, i: number) => (
                   <span key={i} className="px-4 py-2 bg-emerald-500/10 text-emerald-600 font-bold text-xs rounded-full border border-emerald-500/20 flex items-center gap-1">
                     {region} <ArrowUpRight size={12} />
                   </span>
                 ))}
               </div>
             </div>

             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Critical Supplier Shortages</p>
               <div className="flex flex-wrap gap-2">
                 {demandIntelligence.supplierShortages.map((region: string, i: number) => (
                   <span key={i} className="px-4 py-2 bg-rose-500 text-white font-bold text-xs rounded-full shadow-md flex items-center gap-1">
                     <ShieldAlert size={12} /> {region}
                   </span>
                 ))}
               </div>
             </div>
          </div>
        </div>

      </div>

      {/* SECTION 3: AI GROWTH OPPORTUNITIES */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
         <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg"><Lightbulb size={20} /></div>
            <h3 className="font-black text-sm uppercase tracking-widest text-primary">AI Growth Directives</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {growthOpportunities.map((opportunity: string, i: number) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 + (i * 0.1) }}
               className="p-6 bg-background rounded-[1.5rem] border border-border shadow-sm hover:shadow-md transition-all group"
             >
               <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs mb-4 group-hover:scale-110 transition-transform">
                 {i + 1}
               </div>
               <p className="text-sm font-semibold text-foreground">{opportunity}</p>
               <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dim transition-colors flex items-center gap-1">
                 Take Action <ArrowUpRight size={12} />
               </button>
             </motion.div>
           ))}
         </div>
      </div>

    </div>
  );
};
