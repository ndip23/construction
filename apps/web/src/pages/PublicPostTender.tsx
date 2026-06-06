import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import apiClient from '../api/client';
import { MapPin, DollarSign, Send, Loader2, Phone, Sparkles, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const PublicPostTender = () => {
    const navigate = useNavigate();

    // 1. FORM STATE
    const [formData, setFormData] = useState({
        title: '',
        clientName: '',
        location: '',
        budget: '',
        description: '',
        contactEmail: '',
        whatsappNumber: ''
    });

    // 2. BACKEND MUTATION
    const tenderMutation = useMutation({
        mutationFn: (data: any) => apiClient.post('/tenders/public', data),
        onSuccess: () => {
            toast.success("Project Broadcasted! Builders are being notified.");
            // Redirect back to directory after successful broadcast
            navigate('/directory');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || "Broadcast failed. Please check your network.";
            toast.error(msg);
        }
    });

    // 3. SUBMIT HANDLER
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (formData.whatsappNumber.length < 8) {
            return toast.error("Please enter a valid WhatsApp number with country code.");
        }

        tenderMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-background font-inter">
            <PublicNavbar />

            <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
                {/* PAGE HEADER */}
                <header className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 bg-primary-pale text-primary px-4 py-2 rounded-full mb-6"
                    >
                        <Sparkles size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cpromark Network Broadcast</span>
                    </motion.div>
                    <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter mb-4 leading-tight">
                        Post your <span className="text-primary italic">Project.</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto">
                        Provide your project details to receive professional, competitive bids from our verified builders.
                    </p>
                </header>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    {/* MAIN FORM CARD */}
                    <div className="bg-card border border-border p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-border space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

                        {/* PROJECT TITLE */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">Essential Title</label>
                            <input
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-6 bg-muted border-none rounded-3xl text-xl font-black text-foreground focus:ring-4 ring-primary/5 transition-all outline-none"
                                placeholder="e.g. Modern Residential Villa Construction"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">Your Name / Client Identity</label>
                            <input
                                required
                                value={formData.clientName}
                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                className="w-full p-5 bg-muted border-none rounded-2xl text-sm font-bold text-foreground"
                                placeholder="e.g.  Horizon Estates"
                            />
                        </div>
                        {/* LOCATION & BUDGET */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">Site Location</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                                    <input
                                        required
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full p-6 pl-14 bg-muted border-none rounded-3xl text-sm font-bold text-foreground focus:ring-4 ring-primary/5 outline-none transition-all"
                                        placeholder="City, Region"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">Est. Budget ($)</label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                                    <input
                                        required
                                        type="number"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        className="w-full p-6 pl-14 bg-muted border-none rounded-3xl text-sm font-bold text-foreground focus:ring-4 ring-primary/5 outline-none transition-all"
                                        placeholder="Target Amount"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* WHATSAPP CONTACT */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">WhatsApp for Bids (Required)</label>
                            <div className="relative group">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                                <input
                                    required
                                    value={formData.whatsappNumber}
                                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                    className="w-full p-6 pl-14 bg-muted border-none rounded-3xl text-sm font-black text-foreground focus:ring-4 ring-primary/5 outline-none transition-all"
                                    placeholder="e.g. 237670000000"
                                />
                            </div>
                            <p className="text-[9px] text-muted-foreground px-4 font-bold uppercase tracking-widest italic">Include country code. Builders will contact you here.</p>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2">Project Scope</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-8 bg-muted border-none rounded-[3rem] text-sm font-medium text-foreground/70 h-48 resize-none focus:ring-4 ring-primary/5 outline-none transition-all"
                                placeholder="Detail the work, materials, and specialized expertise required..."
                            />
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="flex flex-col items-center gap-6 pt-4">
                        <button
                            type="submit"
                            disabled={tenderMutation.isPending}
                            className="w-full bg-background text-foreground py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-primary-dim hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:bg-white/10"
                        >
                            {tenderMutation.isPending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            Broadcast Project to Network
                        </button>

                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                            <ShieldCheck size={14} />
                            Verified Secure Submission
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default PublicPostTender;