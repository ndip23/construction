import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { CreatePostModal } from '../../components/community/CreatePostModal';
import { t } from '../../theme';
import { MessageSquare, ThumbsUp, Search, Plus, MapPin, Eye, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDebounce } from '../../hooks/useDebounce';

const CommunityHub = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  
  const debouncedSearch = useDebounce(search, 500);
  const debouncedCity = useDebounce(city, 500);
  const debouncedCountry = useDebounce(country, 500);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts', debouncedSearch, category, debouncedCity, debouncedCountry, sortBy],
    queryFn: async () => {
      const { data } = await apiClient.get('/community/posts', {
        params: { 
          search: debouncedSearch, 
          category,
          city: debouncedCity,
          country: debouncedCountry,
          sortBy
        }
      });
      return data;
    }
  });

  const categories = [
    'All', 'Structural Engineering', 'Electrical Systems', 'Plumbing & Water', 
    'Roofing', 'Finishing Works', 'Materials', 'Cost Estimation', 'General'
  ];

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto pb-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="bg-primary-pale text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-3 inline-block">
              Knowledge Hub
            </span>
            <h1 className={t.h1 + ' text-4xl md:text-5xl tracking-tighter'}>Community <span className="text-primary italic">Forum.</span></h1>
            <p className={t.muted + ' font-medium mt-2 max-w-lg'}>
              Ask questions, share project problems, and receive expert advice from verified construction professionals.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-brand-navy px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-yellow hover:bg-primary-dim transition-all flex items-center gap-2 shrink-0"
          >
            <Plus size={16} strokeWidth={3} />
            Ask Question
          </button>
        </header>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input 
                type="text"
                placeholder="Search problems, solutions, or topics..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-2xl pl-12 pr-6 py-4 font-bold text-foreground focus:outline-none focus:border-primary/50 shadow-sm"
              />
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value === 'All' ? '' : e.target.value)}
              className="bg-card border border-border rounded-2xl px-6 py-4 font-bold text-foreground focus:outline-none focus:border-primary/50 shadow-sm"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text"
              placeholder="Filter by Country..."
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="flex-1 bg-card border border-border rounded-2xl px-6 py-4 font-bold text-foreground focus:outline-none focus:border-primary/50 shadow-sm"
            />
            <input 
              type="text"
              placeholder="Filter by City..."
              value={city}
              onChange={e => setCity(e.target.value)}
              className="flex-1 bg-card border border-border rounded-2xl px-6 py-4 font-bold text-foreground focus:outline-none focus:border-primary/50 shadow-sm"
            />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-card border border-border rounded-2xl px-6 py-4 font-bold text-foreground focus:outline-none focus:border-primary/50 shadow-sm"
            >
              <option value="recent">Sort by: Most Recent</option>
              <option value="helpful">Sort by: Most Helpful</option>
            </select>
          </div>
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className={t.label}>Loading discussions...</p>
          </div>
        ) : posts?.length === 0 ? (
          <div className={t.emptyState + " py-20 flex flex-col items-center"}>
            <MessageSquare className="text-foreground/10 mb-4" size={64} />
            <h3 className="text-2xl font-black text-muted-foreground">No discussions found</h3>
            <p className="text-muted-foreground font-medium mt-2">Be the first to ask a question in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts?.map((post: any) => (
              <Link to={`/dashboard/community/${post._id}`} key={post._id}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border p-6 rounded-[2rem] hover:border-primary/30 hover:shadow-card transition-all group flex flex-col md:flex-row gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-muted text-foreground px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-border">
                        {post.category}
                      </span>
                      {post.status === 'Solved' && (
                        <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                          Solved
                        </span>
                      )}
                      {post.urgency === 'Critical' && (
                        <span className="flex items-center gap-1 text-red-500 text-[10px] font-black uppercase tracking-widest">
                          <AlertCircle size={12} /> Critical
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors mb-2 line-clamp-1">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm font-medium line-clamp-2 mb-4">
                      {post.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary"/> {post.location}</span>
                      <span>By <span className="text-foreground">{post.author?.name || 'Anonymous'}</span></span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col items-center justify-end gap-3 shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                    <div className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-xl">
                      <ThumbsUp size={14} className="text-muted-foreground" />
                      <span className="font-black text-sm">{post.upvotes}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-xl">
                      <MessageSquare size={14} className="text-muted-foreground" />
                      <span className="font-black text-sm">{post.commentCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground px-4 py-2">
                      <Eye size={14} />
                      <span className="font-bold text-xs">{post.views} views</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </DashboardShell>
  );
};

export default CommunityHub;
