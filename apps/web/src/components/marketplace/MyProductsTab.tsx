import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Upload, Loader2, CheckCircle2, Edit2, Trash2, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import apiClient from '../../api/client';

export const MyProductsTab = () => {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    unit: 'Unit',
    description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const categories = [
    'Cement', 'Roofing materials', 'Steel reinforcement bars', 
    'Interlocking paving stones', 'Waterproofing materials', 'Solar products'
  ];

  // Fetch My Products
  const { data: myProducts = [], isLoading } = useQuery({
    queryKey: ['my-products'],
    queryFn: async () => {
      const res = await apiClient.get('/marketplace/my-products');
      return res.data;
    }
  });

  const resetForm = () => {
    setFormData({ name: '', category: '', price: '', unit: 'Unit', description: '' });
    setImageFile(null);
    setExistingImage(null);
    setEditingProductId(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setViewMode('form');
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      unit: product.unit,
      description: product.description || ''
    });
    setExistingImage(product.image);
    setImageFile(null);
    setEditingProductId(product._id);
    setViewMode('form');
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ id, inStock }: { id: string, inStock: boolean }) => {
      await apiClient.put(`/marketplace/products/${id}`, { inStock: !inStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-marketplace'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/marketplace/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-marketplace'] });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('category', formData.category);
      data.append('price', formData.price);
      data.append('unit', formData.unit);
      data.append('description', formData.description);
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingProductId) {
        await apiClient.put(`/marketplace/products/${editingProductId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Product updated successfully!');
      } else {
        await apiClient.post('/marketplace/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Product successfully uploaded to the marketplace!');
      }

      resetForm();
      queryClient.invalidateQueries({ queryKey: ['my-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-marketplace'] });
      setTimeout(() => {
        setViewMode('list');
        setSuccessMessage('');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 mt-4 relative z-10 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between bg-card p-4 rounded-3xl border border-border shadow-sm mb-6 max-w-4xl mx-auto">
        <div className="flex bg-muted p-1 rounded-2xl w-fit">
           <button 
             onClick={() => setViewMode('list')}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
           >
             <LayoutGrid size={16} /> My Inventory
           </button>
           <button 
             onClick={handleCreateNew}
             className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'form' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
           >
             <Plus size={16} /> Upload New
           </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        
        {viewMode === 'list' && (
           <div className="space-y-6">
             {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-primary" /></div>
             ) : myProducts.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-[2.5rem] p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground"><Upload size={24} /></div>
                  <h3 className="text-xl font-black text-foreground mb-2">No Products Uploaded</h3>
                  <p className="text-muted-foreground text-sm font-medium mb-6">You haven't listed any materials on the marketplace yet.</p>
                  <button onClick={handleCreateNew} className="bg-primary text-foreground px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm">Upload Your First Product</button>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProducts.map((p: any) => (
                    <motion.div key={p._id} layoutId={p._id} className={`bg-card rounded-[2rem] border overflow-hidden shadow-sm transition-all ${!p.inStock ? 'border-border/50 opacity-70' : 'border-border'}`}>
                      <div className="aspect-video bg-muted relative">
                        <img src={p.image || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23"} alt={p.name} className={`w-full h-full object-cover ${!p.inStock && 'grayscale'}`} />
                        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-border">
                          {p.category}
                        </div>
                        {!p.inStock && (
                          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                             <span className="bg-background text-foreground px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border shadow-md">Unpublished</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                         <h3 className="font-bold text-foreground truncate mb-1">{p.name}</h3>
                         <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl font-black">${p.price}</span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">/ {p.unit}</span>
                         </div>
                         <div className="flex items-center gap-2 pt-4 border-t border-border">
                            <button onClick={() => handleEdit(p)} className="flex-1 py-2 bg-muted hover:bg-primary hover:text-foreground text-foreground text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2">
                               <Edit2 size={12} /> Edit
                            </button>
                            <button 
                               onClick={() => toggleMutation.mutate({ id: p._id, inStock: p.inStock })}
                               disabled={toggleMutation.isPending}
                               className="w-10 h-10 bg-muted hover:bg-foreground hover:text-background text-foreground rounded-xl flex items-center justify-center transition-colors"
                            >
                               {p.inStock ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button 
                               onClick={() => { if(window.confirm('Delete this product permanently?')) deleteMutation.mutate(p._id); }}
                               disabled={deleteMutation.isPending}
                               className="w-10 h-10 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-colors"
                            >
                               <Trash2 size={14} />
                            </button>
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
             )}
           </div>
        )}

        {viewMode === 'form' && (
          <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-foreground shadow-sm">
                {editingProductId ? <Edit2 size={24} /> : <Upload size={24} />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">{editingProductId ? 'Edit Product' : 'Upload Product'}</h2>
                <p className="text-muted-foreground font-medium text-sm">{editingProductId ? 'Update your product details.' : 'List your construction material on the global marketplace.'}</p>
              </div>
            </div>

            {successMessage && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700">
                <CheckCircle2 size={20} />
                <p className="font-bold text-sm">{successMessage}</p>
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* IMAGE UPLOAD PREVIEW */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-widest">Product Image</label>
                <div className="w-full bg-muted border-2 border-dashed border-border rounded-3xl p-4 transition-colors hover:border-primary">
                  {imageFile || existingImage ? (
                    <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden group">
                      <img 
                        src={imageFile ? URL.createObjectURL(imageFile) : existingImage!} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          onClick={() => { setImageFile(null); setExistingImage(null); }} 
                          className="bg-rose-500 text-foreground px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center cursor-pointer relative">
                      <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center text-muted-foreground shadow-sm mb-4">
                        <Upload size={28} />
                      </div>
                      <h3 className="font-black text-foreground text-lg tracking-tight mb-1">Upload Product Photo</h3>
                      <p className="text-muted-foreground font-medium text-sm">Drag and drop or click to select a high-quality image.</p>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-widest">Product Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors" placeholder="e.g. Portland Cement 50kg" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-widest">Category</label>
                  <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors">
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-widest">Price (USD)</label>
                  <input required type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-widest">Unit</label>
                  <input required type="text" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors" placeholder="e.g. Bag, Ton, Sheet" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-widest">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors min-h-[100px]" placeholder="Brief product description..." />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                {editingProductId && (
                   <button type="button" onClick={() => setViewMode('list')} className="px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-muted transition-colors text-foreground">
                      Cancel
                   </button>
                )}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary text-foreground px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editingProductId ? <><CheckCircle2 size={16} /> Save Changes</> : <><Plus size={16} /> Publish Product</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
