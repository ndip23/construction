import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { useAuthStore } from '../../store/useAuthStore';
import { t } from '../../theme';
import { ArrowLeft, MessageSquare, ThumbsUp, Send, CheckCircle2, Sparkles, AlertCircle, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSocket } from '../../lib/socket';
import { useEffect } from 'react';

const socket = getSocket();

const CommunityPostDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['community-post', id],
    queryFn: async () => (await apiClient.get(`/community/posts/${id}`)).data
  });

  const replyMutation = useMutation({
    mutationFn: (data: FormData) => apiClient.post(`/community/posts/${id}/comments`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      setReply('');
      setImages([]);
      // We don't necessarily need to invalidate if socket gives us the comment, 
      // but it's safe to invalidate to ensure sync.
      queryClient.invalidateQueries({ queryKey: ['community-post', id] });
    }
  });

  // Socket listener for real-time comments
  useEffect(() => {
    if (!id) return;
    
    socket.emit('join_community_post', id);

    socket.on('new_community_comment', (newComment) => {
      queryClient.setQueryData(['community-post', id], (oldData: any) => {
        if (!oldData) return oldData;
        // Check if comment already exists
        const exists = oldData.comments.find((c: any) => c._id === newComment._id);
        if (exists) return oldData;
        return {
          ...oldData,
          comments: [...oldData.comments, newComment]
        };
      });
    });

    return () => {
      socket.emit('leave_community_post', id);
      socket.off('new_community_comment');
    };
  }, [id, queryClient]);

  const handleReplySubmit = () => {
    const fd = new FormData();
    fd.append('content', reply);
    if (images.length > 0) {
      images.forEach(file => fd.append('images', file));
    }
    replyMutation.mutate(fd);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(prev => [...prev, ...Array.from(e.target.files!)]);
      // Reset input so the same file can be selected again if removed
      e.target.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const votePostMutation = useMutation({
    mutationFn: () => apiClient.put(`/community/posts/${id}/vote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-post', id] })
  });

  const voteCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiClient.put(`/community/comments/${commentId}/vote`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-post', id] })
  });

  const acceptSolutionMutation = useMutation({
    mutationFn: (commentId: string) => apiClient.put(`/community/comments/${commentId}/accept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-post', id] })
  });

  if (isLoading) return (
    <DashboardShell>
      <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary" size={48}/></div>
    </DashboardShell>
  );

  const { post, comments } = data || {};
  const isAuthor = user?.id === post?.author?._id;

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto pb-32">
        <Link to="/dashboard/community" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Forum
        </Link>

        {/* POST HEADER */}
        <div className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm mb-8 relative overflow-hidden">
          {post?.status === 'Solved' && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-brand-navy font-black text-[10px] uppercase tracking-widest px-6 py-2 rounded-bl-2xl">
              Solved
            </div>
          )}
          
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-muted text-foreground px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-border">
              {post?.category}
            </span>
            {post?.urgency === 'Critical' && (
              <span className="flex items-center gap-1 text-red-500 text-[10px] font-black uppercase tracking-widest">
                <AlertCircle size={12} /> Critical
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-4">{post?.title}</h1>
          
          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mb-8">
            <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full">{post?.author?.name}</span>
            <span>•</span>
            <span>{post?.location}</span>
            <span>•</span>
            <span>{new Date(post?.createdAt).toLocaleString()}</span>
            {post?.budget && (
              <>
                <span>•</span>
                <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Budget: {post.budget}</span>
              </>
            )}
          </div>

          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-foreground/90 font-medium whitespace-pre-wrap leading-relaxed">{post?.description}</p>
          </div>

          {post?.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {post.images.map((img: string, idx: number) => (
                <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                  <img src={img} alt={`Attachment ${idx}`} className="w-full h-32 object-cover rounded-xl border border-border hover:border-primary transition-all" />
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 border-t border-border pt-6">
            <button 
              onClick={() => votePostMutation.mutate()}
              className="flex items-center gap-2 bg-background border border-border px-6 py-3 rounded-2xl hover:border-primary/50 hover:text-primary transition-all font-black text-sm"
            >
              <ThumbsUp size={16} /> 
              {post?.upvotes} Helpful
            </button>
            <div className="flex items-center gap-2 bg-background border border-border px-6 py-3 rounded-2xl font-black text-sm text-muted-foreground">
              <MessageSquare size={16} /> 
              {comments?.length || 0} Replies
            </div>
          </div>
        </div>

        {/* REPLIES */}
        <h3 className={t.h3 + " mb-6"}>Discussion ({comments?.length || 0})</h3>
        
        <div className="space-y-6 mb-12">
          {comments?.map((comment: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={comment._id} 
              className={`p-6 md:p-8 rounded-[2rem] border relative overflow-hidden transition-all ${
                comment.isAcceptedSolution 
                  ? 'bg-emerald-500/5 border-emerald-500/30' 
                  : comment.isAi 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-card border-border'
              }`}
            >
              {comment.isAcceptedSolution && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-brand-navy font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl flex items-center gap-1">
                  <CheckCircle2 size={12} /> Accepted Solution
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                {comment.isAi ? (
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-brand-navy shadow-sm shrink-0">
                    <Sparkles size={20} />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-muted border border-border rounded-xl flex items-center justify-center text-foreground font-black text-lg shrink-0">
                    {comment.author?.name?.charAt(0) || '?'}
                  </div>
                )}
                
                <div>
                  <h4 className="font-bold text-sm text-foreground flex items-center flex-wrap gap-2">
                    {comment.isAi ? 'BuildHub AI Assistant' : comment.author?.name}
                    {comment.isAi && <span className="bg-primary-pale text-primary px-2 py-0.5 rounded text-[9px] uppercase tracking-widest">AI Expert</span>}
                    {!comment.isAi && comment.author?.communityRole && comment.author.communityRole !== 'New Member' && (
                      <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest border border-emerald-500/20">
                        {comment.author.communityRole}
                      </span>
                    )}
                    {!comment.isAi && comment.author?.isVerifiedExpert && (
                      <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest border border-blue-500/20">
                        Verified Pro
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">{new Date(comment.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none text-sm text-foreground/80 mb-4 whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </div>

              {comment.images && comment.images.length > 0 && (
                <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                  {comment.images.map((img: string, idx: number) => (
                    <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img src={img} alt={`Attachment ${idx}`} className="w-24 h-24 object-cover rounded-xl border border-border hover:border-primary transition-all" />
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-4">
                <button 
                  onClick={() => voteCommentMutation.mutate(comment._id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  <ThumbsUp size={14} /> {comment.upvotes}
                </button>
                
                {isAuthor && !comment.isAcceptedSolution && post.status !== 'Solved' && (
                  <button 
                    onClick={() => acceptSolutionMutation.mutate(comment._id)}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-emerald-500 border border-border px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Accept as Solution
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* REPLY BOX */}
        {post?.status !== 'Solved' && (
          <div className="bg-card border border-border p-4 md:p-6 rounded-[2rem] shadow-sm">
            <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground mb-4">Add your voice</h4>
            <div className="flex flex-col gap-4">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Share your advice or ask a follow-up question..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 font-medium text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none"
                rows={3}
              />
              {images.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative shrink-0">
                      <img src={URL.createObjectURL(img)} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded-xl border border-border" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full md:w-auto bg-background border border-border rounded-xl px-4 py-2 font-bold text-foreground focus:outline-none focus:border-primary/50 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all text-xs"
                  onChange={handleFileChange}
                />
                <button 
                  onClick={handleReplySubmit}
                  disabled={!reply.trim() || replyMutation.isPending}
                  className="bg-foreground text-background px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-brand-navy transition-all disabled:opacity-50 shrink-0"
                >
                  {replyMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Reply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default CommunityPostDetail;
