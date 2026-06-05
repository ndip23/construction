import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import apiClient from '../api/client';
import { 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  Package, 
  Star, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

const MarketplaceProduct = () => {
  const { id } = useParams(); // Get product ID from URL
  const navigate = useNavigate();

  // 1. FETCH REAL PRODUCT DATA FROM BACKEND
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/marketplace/products/${id}`);
      return data;
    },
    enabled: !!id
  });

  // 2. HANDLE LOADING STATE (Apple-style clean loader)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mb-4 mx-auto" size={40} />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Accessing Supply Database...</p>
        </div>
      </div>
    );
  }

  // 3. HANDLE ERROR OR 404
  if (isError || !product) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="text-rose-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-black text-foreground">Product Not Found</h2>
          <p className="text-brand-muted mt-2 mb-8">The material or equipment you're looking for might have been delisted or moved.</p>
          <button onClick={() => navigate('/marketplace')} className="bg-background text-foreground px-8 py-3 rounded-xl font-bold text-xs">
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      <PublicNavbar />
      
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] mb-10 hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Results
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* IMAGE CANVAS (REAL CLOUDINARY URL) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square bg-muted rounded-[3.5rem] overflow-hidden shadow-2xl border border-border flex items-center justify-center relative"
          >
             <img 
               src={product.image || "https://via.placeholder.com/600"} 
               className="w-full h-full object-cover" 
               alt={product.name} 
             />
             {!product.inStock && (
               <div className="absolute inset-0 bg-card/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-rose-500 text-foreground px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-xl">Out of Stock</span>
               </div>
             )}
          </motion.div>

          {/* PRODUCT SPECS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                product.inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground'
              }`}>
                {product.inStock ? 'Available' : 'Restocking Soon'}
              </span>
              <div className="flex items-center gap-1 text-amber-500 ml-2">
                <Star size={14} fill="currentColor" />
                <span className="text-[10px] font-black text-foreground/70">{product.rating || '4.8'} Verified</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-2 leading-tight">
              {product.name}
            </h1>
            <p className="text-xl text-muted-foreground font-medium mb-8">
              Supplied by <span className="text-primary underline font-bold cursor-pointer">{product.supplier}</span>
            </p>

            <div className="flex items-end gap-3 mb-12 bg-muted p-6 rounded-[2rem] border border-border w-fit">
               <span className="text-5xl font-black text-foreground tracking-tighter">${product.price?.toLocaleString()}</span>
               <span className="text-muted-foreground font-bold mb-2 uppercase text-xs tracking-widest">/ Per {product.unit}</span>
            </div>

            <div className="space-y-4 mb-12">
               <div className="flex items-center gap-5 p-6 bg-card rounded-3xl border border-border shadow-sm">
                  <div className="w-12 h-12 bg-primary-pale rounded-2xl flex items-center justify-center text-primary">
                    <Truck size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">Regional Logistics</p>
                    <p className="text-xs text-muted-foreground font-medium">Estimated 3-5 days delivery to active sites.</p>
                  </div>
               </div>
               <div className="flex items-center gap-5 p-6 bg-card rounded-3xl border border-border shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">Authenticity Guarantee</p>
                    <p className="text-xs text-muted-foreground font-medium">100% genuine material certs included.</p>
                  </div>
               </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-col sm:flex-row gap-4">
               <button 
                disabled={!product.inStock}
                className="flex-1 bg-background text-foreground py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-yellow hover:bg-primary-dim disabled:bg-muted transition-all flex items-center justify-center gap-3"
               >
                 <Package size={20} /> Request Bulk Quote
               </button>
               {product.ownerId ? (
                 <a 
                   onClick={() => {
                      apiClient.post('/marketplace/track', { 
                        action: 'whatsapp_click', 
                        region: 'Unknown', 
                        city: 'Unknown', 
                        metadata: { productId: product._id, productName: product.name, supplierId: product.ownerId, category: product.category } 
                      }).catch(console.error);
                   }}
                   href={`https://wa.me/${product.whatsappNumber || ''}?text=${encodeURIComponent(`Hello, I would like to purchase or get more information about your product: ${product.name} (Category: ${product.category}, Price: $${product.price} per ${product.unit}).`)}`}
                   target="_blank"
                   rel="noreferrer"
                   className="px-10 py-5 bg-card text-foreground font-black text-xs uppercase tracking-widest rounded-2xl border-2 border-border hover:bg-muted transition-all text-center"
                 >
                   Contact Rep
                 </a>
               ) : (
                 <button disabled className="px-10 py-5 bg-card text-muted-foreground font-black text-xs uppercase tracking-widest rounded-2xl border-2 border-border opacity-50 cursor-not-allowed">
                   No Contact Info
                 </button>
               )}
            </div>
            
            <div className="mt-8 flex items-center gap-2 justify-center lg:justify-start text-[10px] font-black text-foreground/35 uppercase tracking-widest">
              <CheckCircle2 size={12} className="text-emerald-500" /> Secure Cpromark Transaction
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MarketplaceProduct;