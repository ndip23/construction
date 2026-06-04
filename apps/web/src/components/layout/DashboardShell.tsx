import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';

import {
  Search,
  Bell,
  Menu,
  X,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import { Link, useLocation, useNavigate } from 'react-router-dom';

interface DashboardSummary {
  msgCount?: number;
  tenderCount?: number;
}

interface DashboardShellProps {
  children: React.ReactNode;
}

const ONBOARDING_STEPS = [
  { id: 'wallet', label: 'Fund Wallet', desc: 'Add funds to activate your account features.' },
  { id: 'profile', label: 'Business Profile', desc: 'Complete your professional identity details.' },
  { id: 'service', label: 'Add Service', desc: 'List at least one professional service you offer.' },
  { id: 'product', label: 'Add Product', desc: 'Upload a product to the marketplace.' },
  { id: 'tour', label: 'Dashboard Tour', desc: 'Take a quick tour of your new command center.' }
];

const OnboardingProgress = ({ currentStep }: { currentStep: string }) => {
  if (currentStep === 'done') return null;

  const currentIndex = ONBOARDING_STEPS.findIndex(s => s.id === currentStep);
  const currentDetails = ONBOARDING_STEPS[currentIndex] || ONBOARDING_STEPS[0];

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 mb-8 mt-2 mx-3 sm:mx-4 md:mx-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-primary" />
            <h3 className="font-black text-primary text-sm uppercase tracking-widest">Account Setup Incomplete</h3>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            <strong className="text-foreground">Current Step: {currentDetails.label}</strong> — {currentDetails.desc}
          </p>
        </div>
        <div className="flex-1 w-full max-w-xl">
          <div className="flex items-center justify-between mb-2">
            {ONBOARDING_STEPS.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1 relative">
                {idx !== 0 && (
                  <div className={`absolute top-3 right-1/2 w-full h-[2px] -z-10 transition-colors duration-500 ${idx <= currentIndex ? 'bg-primary' : 'bg-border'}`} />
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors duration-500 z-10 ${
                  idx < currentIndex ? 'bg-primary text-brand-navy' : 
                  idx === currentIndex ? 'bg-background border-2 border-primary text-primary' : 
                  'bg-muted text-muted-foreground border border-border'
                }`}>
                  {idx < currentIndex ? <CheckCircle2 size={12} /> : idx + 1}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${idx <= currentIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardShell = ({
  children,
}: DashboardShellProps) => {
  const { user } = useAuthStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [showMobileSearch, setShowMobileSearch] =
    useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { getStep } = useOnboardingStore();
  const currentStep = user?.id ? getStep(user.id) : 'done';
  
  // FORCE ONBOARDING REDIRECT
  useEffect(() => {
    if (user?.role !== 'owner' || currentStep === 'done') return;
    
    const stepPaths: Record<string, string> = {
      wallet: '/dashboard/wallet',
      profile: '/dashboard/settings/business',
      service: '/dashboard/services',
      product: '/dashboard/marketplace',
      tour: '/dashboard'
    };

    const expectedPath = stepPaths[currentStep];
    if (expectedPath && location.pathname !== expectedPath && !location.pathname.includes('/admin')) {
      navigate(expectedPath, { replace: true });
    }
  }, [user, location.pathname, navigate, getStep]);

  // FETCH DASHBOARD SUMMARY
  const {
    data: summary,
    isLoading,
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],

    queryFn: async () => {
      const { data } = await apiClient.get(
        '/auth/company/summary'
      );

      return data;
    },

    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // FETCH COMPANY PROFILE FOR DYNAMIC LOGO
  const { data: companyProfile } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => (await apiClient.get('/auth/company/profile')).data,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // LOCK BODY SCROLL WHEN MOBILE MENU OPEN
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen h-screen bg-background overflow-hidden font-inter text-foreground"
    >
      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] lg:hidden"
              onClick={() =>
                setIsMobileMenuOpen(false)
              }
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 320,
              }}
              className="fixed left-0 top-0 bottom-0 z-[70] lg:hidden shadow-2xl"
            >
              <Sidebar
                onNavigate={() =>
                  setIsMobileMenuOpen(false)
                }
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 relative">

        {/* HEADER */}
        <header className="h-16 sm:h-20 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-3 sm:px-4 md:px-8 shrink-0 z-50">

          {/* LEFT */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() =>
                setIsMobileMenuOpen(true)
              }
              className="p-2 sm:p-2.5 bg-muted rounded-xl lg:hidden shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* DESKTOP SEARCH */}
            <div className="hidden md:flex items-center gap-3 bg-muted px-4 py-2.5 rounded-2xl border border-border w-full max-w-md focus-within:ring-2 ring-primary/10 transition-all">

              <Search
                size={18}
                className="text-muted-foreground shrink-0"
              />

              <input
                type="text"
                placeholder="Search projects, materials..."
                className="bg-transparent border-none outline-none text-sm w-full font-medium min-w-0"
              />
            </div>

            {/* MOBILE SEARCH BUTTON */}
            <button
              type="button"
              onClick={() =>
                setShowMobileSearch((prev) => !prev)
              }
              className="p-2 sm:p-2.5 bg-muted rounded-xl md:hidden shrink-0"
              aria-label="Search"
            >
              <Search
                size={20}
                className="text-brand-muted"
              />
            </button>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 ml-2 sm:ml-4 shrink-0">

            {/* ICONS */}
            <div className="flex items-center gap-0.5 sm:gap-2">

              {/* MAIL */}
              <button
                type="button"
                className="p-2 sm:p-2.5 text-muted-foreground hover:bg-muted rounded-xl relative transition-all"
              >
                <Mail
                  size={18}
                  className="sm:w-5 sm:h-5"
                />

                {(summary?.msgCount ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 text-[9px] font-bold text-white rounded-full border border-background animate-pulse">
                    {summary?.msgCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATIONS */}
              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setShowNotifications((prev) => !prev)
                  }
                  className={`p-2 sm:p-2.5 rounded-xl transition-all relative ${showNotifications
                      ? 'bg-primary text-brand-navy shadow-lg shadow-yellow-200'
                      : 'text-muted-foreground hover:bg-muted'
                    }`}
                  aria-label="Notifications"
                >
                  <Bell
                    size={18}
                    className="sm:w-5 sm:h-5"
                  />

                  {(summary?.tenderCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 text-[9px] font-bold text-white rounded-full border border-background">
                      {summary?.tenderCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATION PANEL */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: 10,
                      }}
                      className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-1.5rem))] bg-card rounded-2xl sm:rounded-[2rem] shadow-2xl border border-border p-4 sm:p-6 z-[100]"
                    >
                      <h4 className="font-black text-xs uppercase tracking-widest mb-4">
                        Latest Alerts
                      </h4>

                      {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="space-y-4">

                          <div className="text-[11px] font-bold text-black flex gap-3">
                            <div className="w-2 h-2 bg-primary text-black rounded-full mt-1 shrink-0" />

                            {(summary?.tenderCount ?? 0) > 0
                              ? `${summary?.tenderCount} New Tenders available for bidding.`
                              : 'No new tenders available.'}
                          </div>

                          <div className="text-[11px] font-bold text-black flex gap-3">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full mt-1 shrink-0" />

                            {(summary?.msgCount ?? 0) > 0
                              ? `${summary?.msgCount} unread messages received.`
                              : 'No unread messages.'}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* USER */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border py-1 sm:py-2">

              <div className="text-right hidden sm:block">
                <p className="text-xs font-black truncate max-w-[100px] md:max-w-[150px]">
                  {user?.company || 'Building Co.'}
                </p>

                <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                  Premium Member
                </p>
              </div>

              <Link to="/dashboard/settings/business" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-background border border-border flex items-center justify-center text-foreground font-black text-xs shadow-lg shrink-0 hover:scale-105 transition-all overflow-hidden cursor-pointer">
                {companyProfile?.logo || (user as any)?.logo ? (
                  <img src={companyProfile?.logo || (user as any)?.logo} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  companyProfile?.name?.charAt(0) || user?.company?.charAt(0) || 'B'
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* MOBILE SEARCH */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: 'auto',
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              className="md:hidden px-3 pb-3 bg-card border-b border-border overflow-hidden"
            >
              <div className="flex items-center gap-3 bg-muted px-4 py-2.5 rounded-2xl border border-border">

                <Search
                  size={18}
                  className="text-muted-foreground shrink-0"
                />

                <input
                  type="text"
                  placeholder="Search projects, materials..."
                  className="bg-transparent border-none outline-none text-sm w-full font-medium"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowMobileSearch(false)
                  }
                  aria-label="Close search"
                >
                  <X
                    size={18}
                    className="text-muted-foreground"
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ONBOARDING PROGRESS BANNER */}
        {user?.role === 'owner' && <OnboardingProgress currentStep={currentStep} />}

        {/* PAGE CONTENT */}
        <section className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-8 custom-scrollbar">
          {children}
        </section>
      </main>
    </motion.div>
  );
};
