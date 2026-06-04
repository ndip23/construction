import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '../components/layout/DashboardShell';
import apiClient from '../api/client';
import {
  Truck,
  Package, 
  ChevronRight, 
  Loader2, 
  TrendingUp,
  FileText,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MarketplaceIntelligenceTab } from '../components/marketplace/MarketplaceIntelligenceTab';
import { MyProductsTab } from '../components/marketplace/MyProductsTab';
import { useState } from 'react';

const MarketplaceManager = () => {
  // 1. FETCH ACTIVE SHIPMENTS
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['active-shipments'],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketplace/orders'); // Real Backend Route
      return data;
    }
  });

  // 2. FETCH PROCUREMENT STATS
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['procurement-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketplace/stats'); // Real Backend Route
      return data;
    }
  });

  const [activeTab, setActiveTab] = useState<'logistics' | 'intelligence' | 'my_products'>('intelligence');

  return (
    <DashboardShell>
      <div className="max-w-[1600px] mx-auto pb-20 relative">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Logistics Active</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
              Supply Chain <br />
              <span className="text-primary">& Logistics</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-3 max-w-lg">
                Manage material procurement, track active deliveries, and leverage AI to predict demand.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-muted p-1.5 rounded-[2rem] shadow-inner">
             <button 
                onClick={() => setActiveTab('logistics')}
                className={`px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
                  activeTab === 'logistics' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
             >
               Logistics
             </button>
             <button 
                onClick={() => setActiveTab('intelligence')}
                className={`px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'intelligence' ? 'bg-primary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
             >
               <TrendingUp size={14} /> AI Intelligence
             </button>
             <button 
                onClick={() => setActiveTab('my_products')}
                className={`px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
                  activeTab === 'my_products' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
             >
               Upload Product
             </button>
          </div>
        </header>

        {activeTab === 'intelligence' ? (
          <MarketplaceIntelligenceTab />
        ) : activeTab === 'my_products' ? (
          <MyProductsTab />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            
            {/* TRACKING SECTION */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-foreground text-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[1rem] bg-foreground flex items-center justify-center text-background shadow-sm">
                    <Truck size={20} />
                  </div>
                  Active Deliveries
              </h3>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {orders?.length || 0} In Transit
              </span>
            </div>
            
            {ordersLoading ? (
              <div className="py-20 text-center animate-pulse flex flex-col items-center">
                <Loader2 className="animate-spin text-foreground mb-4" size={32} />
                <p className="font-bold text-muted-foreground">Locating shipments...</p>
              </div>
            ) : orders?.length === 0 ? (
              <div className="bg-muted border border-border p-20 rounded-[3rem] border-dashed text-center">
                 <Package className="mx-auto text-foreground/20 mb-6" size={56} />
                 <h3 className="text-2xl font-black text-foreground tracking-tight">No active orders</h3>
                 <p className="text-sm text-muted-foreground mt-2 font-medium">Your supply chain is currently idle.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders?.map((order: any, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    key={order._id} 
                    className="bg-card border border-border p-6 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                  >
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-muted rounded-[1.5rem] flex items-center justify-center text-foreground group-hover:bg-primary transition-all duration-300 shadow-sm">
                            <Package size={28} />
                         </div>
                         <div>
                            <h4 className="font-black text-foreground text-lg">{order.itemName}</h4>
                            <div className="flex items-center gap-2 mt-1 opacity-70">
                              <Clock size={12} className="text-muted-foreground" />
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">
                                {order.supplier} • #{order.orderNumber}
                              </p>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-4 sm:mt-0 border-t sm:border-t-0 border-border pt-4 sm:pt-0">
                         <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full animate-pulse ${order.status === 'In Transit' ? 'bg-primary' : 'bg-foreground/40'}`} />
                           <span className={`text-[10px] font-black uppercase tracking-widest ${
                             order.status === 'In Transit' ? 'text-primary' : 'text-foreground/60'
                           }`}>
                             {order.status}
                           </span>
                         </div>
                         <button className="w-12 h-12 bg-muted rounded-[1.25rem] flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-colors duration-300 shadow-sm border border-border">
                            <ChevronRight size={20} />
                         </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ANALYTICS WIDGET */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-foreground p-10 rounded-[3rem] text-background shadow-xl relative overflow-hidden h-[460px] flex flex-col justify-between border border-foreground"
            >
               
               <div className="absolute top-4 right-4 opacity-5 text-background">
                  <TrendingUp size={180} />
               </div>
               
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-background/60 uppercase tracking-[0.2em]">Procurement Budget</p>
                  </div>
                  
                  {statsLoading ? (
                    <div className="h-14 w-40 bg-background/10 animate-pulse rounded-xl" />
                  ) : (
                    <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-background">
                      ${stats?.totalSpent?.toLocaleString() || '0.00'}
                    </h2>
                  )}
                  
                  <div className="mt-8 flex items-center gap-4">
                    <div className="w-full h-2 bg-background/10 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats?.budgetUtilization || 0}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-primary relative"
                       />
                    </div>
                    <span className="text-sm font-black text-background">{stats?.budgetUtilization || 0}%</span>
                  </div>
                  <p className="text-xs text-background/60 mt-4 font-semibold uppercase tracking-widest">
                    Available Credit: <span className="text-primary">${stats?.availableCredit?.toLocaleString() || '0.00'}</span>
                  </p>
               </div>

               <div className="space-y-3 relative z-10">
                  <button className="w-full py-4 bg-background/5 hover:bg-background/10 transition-colors rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border border-background/20 flex items-center justify-center gap-2 group/btn">
                    <FileText size={16} className="text-background/50 group-hover/btn:text-background transition-colors" /> Download Log
                  </button>
                  <button className="w-full py-4 bg-primary text-foreground hover:bg-primary-dim transition-colors rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-md">
                    Manage Suppliers
                  </button>
               </div>
            </motion.div>

            {/* QUICK INFO CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
            >
                <div className="absolute right-0 top-0 w-32 h-32 bg-muted rounded-bl-[100px] pointer-events-none" />
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 bg-muted rounded-[1.25rem] flex items-center justify-center text-foreground shadow-sm border border-border">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-foreground text-lg tracking-tight">Efficiency Score</h4>
                        <p className="text-xs text-muted-foreground font-semibold mt-1">Material waste reduced by 14%</p>
                    </div>
                </div>
            </motion.div>
          </div>

        </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default MarketplaceManager;