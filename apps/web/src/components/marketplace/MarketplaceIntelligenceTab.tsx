import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, BrainCircuit, Activity,
  MapPin, Search, Target, BarChart3,
  Lightbulb, PackageSearch, RefreshCw, Star, ArrowUpRight,
  MessageCircle, Eye, User, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';

export const MarketplaceIntelligenceTab = () => {
  const { data: intelligence, isLoading } = useQuery({
    queryKey: ['supplier-intelligence'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/marketplace/intelligence/supplier', {
          skipErrorToast: true
        } as any);

        if (data._aiUnavailable) {
          toast.error('AI Intelligence is unavailable at the moment');
          const cached = localStorage.getItem('marketplace-intelligence-cache');
          if (cached) {
            const parsedCache = JSON.parse(cached);
            // Merge fresh metrics into the cached AI data
            if (parsedCache.trafficIntelligence && data.trafficIntelligence) {
              parsedCache.trafficIntelligence.metrics = data.trafficIntelligence.metrics;
            }
            return parsedCache;
          }
          return data; // Return the safe fallback data if no cache
        }

        localStorage.setItem('marketplace-intelligence-cache', JSON.stringify(data));
        return data;
      } catch (error: any) {
        toast.error('Gemini is unable at the moment');
        console.error('Gemini Error:', error?.response?.data || error.message);
        
        const cached = localStorage.getItem('marketplace-intelligence-cache');
        if (cached) {
          return JSON.parse(cached);
        }
        
        // Return null instead of throwing to prevent crashing if no cache
        return null;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
          <BrainCircuit className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
        </div>
        <p className="text-sm font-black text-muted-foreground uppercase tracking-widest animate-pulse">
          Synthesizing AI Intelligence...
        </p>
      </div>
    );
  }

  if (!intelligence) {
    return <div className="text-center py-20 text-muted-foreground">No intelligence data available.</div>;
  }

  const {
    demandForecasting, regionalDemand, searchIntelligence, marketplaceOpportunity,
    supplierSalesIntelligence, priceIntelligence,
    trafficIntelligence, aiMarketing, inventoryPrediction, seasonalDemand,
    marketplaceHealthScore
  } = intelligence;

  return (
    <div className="space-y-8 pb-20 mt-4 relative z-10 animate-in fade-in duration-500">
      
      {/* SECTION 1: Direct Interactions (Pulled to top as requested) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'WhatsApp Clicks', val: trafficIntelligence.metrics.whatsappClicks || 0, icon: <MessageCircle size={28}/>, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Product Views', val: trafficIntelligence.metrics.productViews || 0, icon: <Eye size={28}/>, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'Profile Visits', val: trafficIntelligence.metrics.profileVisits || 0, icon: <User size={28}/>, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
          { label: 'RFQ Requests', val: trafficIntelligence.metrics.rfqRequests || 0, icon: <FileText size={28}/>, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
        ].map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={i} 
            className={`bg-card border ${m.border} p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex items-center justify-between`}
          >
             <div>
               <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">{m.label}</p>
               <p className="text-4xl font-black text-foreground">{m.val}</p>
             </div>
             <div className={`p-4 rounded-[1.5rem] ${m.bg} ${m.color} shadow-inner`}>
                {m.icon}
             </div>
          </motion.div>
        ))}
      </div>

      {/* SECTION 2: AI Forecasting & Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Demand Forecasting (Made super premium) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="md:col-span-2 bg-foreground text-background p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between group"
        >
          <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
             <BrainCircuit size={300} />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-background/60">Demand Forecast</h3>
              </div>
              <h4 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.1] mb-4">
                {demandForecasting.category} demand in <span className="text-primary">{demandForecasting.region}</span> expected to increase by <span className="text-emerald-400">{demandForecasting.percentageIncrease}%</span>
              </h4>
              <p className="text-xs font-semibold text-background/60 mb-8 uppercase tracking-widest">Within the next {demandForecasting.timeframeDays} days.</p>
              
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-primary/10 text-primary rounded-[1.5rem] text-xs font-bold uppercase tracking-widest border border-primary/20 backdrop-blur-sm">
                <Lightbulb size={16} /> {demandForecasting.recommendation}
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-background/10 pt-8 md:pt-0 md:pl-10 flex flex-col justify-center">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-background/60 mb-6">Seasonal AI Prediction</h3>
              <div className="flex items-start gap-5 bg-background/5 p-6 rounded-[2rem] border border-background/10">
                <div className="p-4 bg-background/10 rounded-[1.5rem]"><RefreshCw size={24} className="text-background/90" /></div>
                <div>
                  <h4 className="font-black text-lg text-background mb-1">{seasonalDemand.product}</h4>
                  <p className="text-xs text-background/70 mb-4">{seasonalDemand.season} is approaching.</p>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">{seasonalDemand.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Marketplace Health Score */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden flex flex-col justify-between"
        >
          <div>
             <div className="flex justify-between items-start mb-8 relative z-10">
               <div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Overall Profile Health</h3>
                 <div className="flex items-end gap-2">
                   <span className="text-6xl font-black text-foreground tracking-tighter">{marketplaceHealthScore.score}</span>
                   <span className="text-xl font-bold text-muted-foreground mb-2">/ {marketplaceHealthScore.maxScore}</span>
                 </div>
               </div>
               <div className="p-4 bg-primary/10 text-primary rounded-[1.5rem]"><Star size={28} className="fill-primary/20" /></div>
             </div>
             
             <div className="w-full bg-muted h-3 rounded-full overflow-hidden mb-8">
                <div className="bg-primary h-full rounded-full" style={{ width: `${(marketplaceHealthScore.score / marketplaceHealthScore.maxScore) * 100}%` }} />
             </div>
          </div>
          
          <div className="relative z-10">
            <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-4">Quick Wins</h4>
            <ul className="space-y-3">
              {marketplaceHealthScore.recommendations.slice(0, 3).map((rec: string, i: number) => (
                <li key={i} className="text-xs text-muted-foreground font-medium flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0 shadow-sm" /> {rec}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* SECTION 3: Search, Regional, Opportunity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Search Intelligence */}
        <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-muted rounded-[1.25rem] flex items-center justify-center text-foreground"><Search size={20} /></div>
            <h3 className="font-black text-sm uppercase tracking-widest">Search Intelligence</h3>
          </div>
          <div className="text-center py-4">
             <div className="inline-flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-6 relative shadow-inner">
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                </span>
                <span className="text-4xl font-black">{searchIntelligence.searches}</span>
             </div>
             <h4 className="text-sm font-bold leading-relaxed max-w-[220px] mx-auto">Users searched for <span className="text-primary font-black">{searchIntelligence.product}</span> {searchIntelligence.timeframe}.</h4>
             <p className="text-xs text-muted-foreground mt-4 font-medium px-4 py-2 bg-muted rounded-xl inline-block">Only {searchIntelligence.supplierCount} suppliers offer this.</p>
             <div className="mt-6 w-full py-4 bg-emerald-50 text-emerald-600 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest border border-emerald-100">
               {searchIntelligence.status}
             </div>
          </div>
        </div>
        
        {/* Regional Demand Analysis */}
        <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-muted rounded-[1.25rem] flex items-center justify-center text-foreground"><MapPin size={20} /></div>
            <h3 className="font-black text-sm uppercase tracking-widest">Regional Heatmap</h3>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {regionalDemand.map((region: any, i: number) => (
              <div key={i} className="p-5 bg-muted/40 rounded-[1.5rem] border border-border/50 hover:bg-muted/80 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-black text-sm">{region.region}</h4>
                  <span className="text-[9px] font-black text-rose-500 uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Hot Area</span>
                </div>
                <p className="text-xs font-bold text-foreground mb-2">{region.topCategory}</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">{region.insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunity Detection */}
        <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-muted rounded-[1.25rem] flex items-center justify-center text-foreground"><Target size={20} /></div>
            <h3 className="font-black text-sm uppercase tracking-widest">Market Opportunity</h3>
          </div>
          <div className="h-[calc(100%-80px)] flex flex-col">
            <div className="flex-1 bg-gradient-to-br from-primary/10 to-transparent rounded-[2rem] p-8 border border-primary/20 flex flex-col justify-center relative overflow-hidden">
              <Activity size={100} className="absolute -right-4 -bottom-4 text-primary/10" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 inline-block bg-primary/10 w-fit px-3 py-1 rounded-full">{marketplaceOpportunity.status}</span>
              <h4 className="text-2xl font-black mb-4 leading-tight">{marketplaceOpportunity.category}</h4>
              <p className="text-xs text-muted-foreground font-medium mb-8 leading-relaxed">Demand is increasing rapidly while current supplier count is insufficient. Stocking this item now provides a first-mover advantage.</p>
              <button className="w-full py-4 bg-foreground text-background rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                 Act on Insight <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 4: Sales, Pricing, Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales & Inventory */}
        <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm">
           <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-muted rounded-[1.25rem] flex items-center justify-center text-foreground"><PackageSearch size={20} /></div>
             <h3 className="font-black text-sm uppercase tracking-widest">Sales & Inventory Intel</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-6 mb-8">
             <div className="p-5 bg-muted/40 rounded-[2rem] border border-border/50">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Top Performers</p>
               <div className="space-y-3">
                 {supplierSalesIntelligence.topPerforming.slice(0,3).map((p: string, i: number) => (
                   <p key={i} className="text-xs font-bold truncate flex items-center gap-2 bg-background p-2 rounded-xl"><ArrowUpRight size={14} className="text-emerald-500 shrink-0"/> <span className="truncate">{p}</span></p>
                 ))}
               </div>
             </div>
             <div className="p-5 bg-muted/40 rounded-[2rem] border border-border/50">
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Underperforming</p>
               <div className="space-y-3">
                 {supplierSalesIntelligence.lowPerforming.slice(0,3).map((p: string, i: number) => (
                   <p key={i} className="text-xs font-bold truncate flex items-center gap-2 bg-background p-2 rounded-xl"><TrendingDown size={14} className="text-rose-500 shrink-0"/> <span className="truncate">{p}</span></p>
                 ))}
               </div>
             </div>
           </div>

           <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem]">
             <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-rose-100 rounded-xl"><RefreshCw size={18} className="text-rose-600" /></div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600">Inventory Alert</h4>
             </div>
             <p className="text-sm font-semibold mb-3 leading-relaxed text-foreground">Based on current demand trajectory, your <span className="font-black">{inventoryPrediction.product}</span> inventory may run out in <span className="text-rose-600 font-black">{inventoryPrediction.daysRemaining} days</span>.</p>
             <div className="inline-block px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 shadow-sm text-foreground">
               Recommended restock: {inventoryPrediction.recommendedRestock} units
             </div>
           </div>
        </div>

        {/* Pricing & AI Marketing */}
        <div className="space-y-6 flex flex-col">
           <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm flex-1">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-muted rounded-[1.25rem] flex items-center justify-center text-foreground"><BarChart3 size={20} /></div>
               <h3 className="font-black text-sm uppercase tracking-widest">Price Intelligence</h3>
             </div>
             
             <div className="flex items-center justify-between mb-8 p-6 bg-muted/30 border border-border rounded-[2rem]">
               <div>
                 <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2">Market Avg ({priceIntelligence.region})</p>
                 <p className="text-2xl font-black">XAF {priceIntelligence.averageMarketPrice.toLocaleString()}</p>
               </div>
               <div className="h-12 w-[1px] bg-border mx-4"></div>
               <div className="text-right">
                 <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-2">Your Avg Price</p>
                 <p className="text-2xl font-black text-rose-500">XAF {priceIntelligence.yourPrice.toLocaleString()}</p>
               </div>
             </div>
             
             <div className="p-6 bg-primary-pale border border-primary/20 rounded-[2rem] flex items-start gap-4">
               <div className="p-3 bg-primary/10 rounded-xl text-primary"><Lightbulb size={24} /></div>
               <div>
                 <p className="text-sm font-semibold leading-relaxed">You are <span className="font-black text-primary">{priceIntelligence.differencePercentage}% {priceIntelligence.status}</span>. Consider adjusting your pricing to capture more volume while maintaining margins.</p>
               </div>
             </div>
           </div>

           {/* AI Marketing Insight */}
           <div className="bg-primary p-8 rounded-[2.5rem] text-primary-foreground shadow-md relative overflow-hidden flex items-center">
             <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.08]"><TrendingUp size={150} /></div>
             <div className="relative z-10">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground/70 mb-4 flex items-center gap-2"><BrainCircuit size={14}/> AI Marketing Insight</h3>
               <h4 className="text-xl font-black leading-tight mb-3">{aiMarketing.trend}</h4>
               <p className="text-xs font-semibold text-primary-foreground/90 leading-relaxed max-w-lg">{aiMarketing.recommendation}</p>
             </div>
           </div>
        </div>

      </div>

    </div>
  );
};
