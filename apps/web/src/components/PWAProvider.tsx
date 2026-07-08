import React, { createContext, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Smartphone, Monitor } from 'lucide-react';

interface PWAContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  showPopup: boolean;
  setShowPopup: (show: boolean) => void;
  installPWA: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};

export const PWAProvider = ({ children }: { children: React.ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Reset instructions state when modal is closed
  useEffect(() => {
    if (!showPopup) {
      setShowInstructions(false);
    }
  }, [showPopup]);

  // Check standalone and user agent
  useEffect(() => {
    const checkIsStandalone = () => {
      return (
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true
      );
    };

    const checkIsIOS = () => {
      const ua = navigator.userAgent;
      const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      return ios;
    };

    setIsStandalone(checkIsStandalone());
    setIsIOS(checkIsIOS());

    // Listen for custom standalone change
    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const onChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    mediaQuery?.addEventListener('change', onChange);

    return () => {
      mediaQuery?.removeEventListener('change', onChange);
    };
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    if (isStandalone) return;

    const onPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // If we just logged in and were waiting for this prompt, trigger the popup
      if (sessionStorage.getItem('justLoggedIn') === 'true' || pendingPrompt) {
        setShowPopup(true);
        setPendingPrompt(false);
        sessionStorage.removeItem('justLoggedIn');
      }
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowPopup(false);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [isStandalone, pendingPrompt]);

  // Handle automatic popup on login
  useEffect(() => {
    if (isStandalone) {
      sessionStorage.removeItem('justLoggedIn');
      return;
    }

    const checkLoginTrigger = () => {
      if (sessionStorage.getItem('justLoggedIn') === 'true') {
        if (isIOS) {
          // iOS Safari doesn't trigger beforeinstallprompt, show prompt immediately
          setShowPopup(true);
          sessionStorage.removeItem('justLoggedIn');
        } else if (deferredPrompt) {
          // If prompt event already fired, show it
          setShowPopup(true);
          sessionStorage.removeItem('justLoggedIn');
        } else {
          // Wait for beforeinstallprompt to fire
          setPendingPrompt(true);
        }
      }
    };

    // Run check shortly after load to let stores/state settle
    const timer = setTimeout(checkLoginTrigger, 800);
    return () => clearTimeout(timer);
  }, [isStandalone, isIOS, deferredPrompt]);

  const installPWA = async () => {
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
      setShowPopup(false);
    } catch (err) {
      setShowInstructions(true);
    }
  };

  const isInstallable = !isStandalone;

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isStandalone,
        isIOS,
        showPopup,
        setShowPopup,
        installPWA,
      }}
    >
      {children}

      {/* Global Installation Modal */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-card/95 border border-border/80 shadow-2xl rounded-[2.5rem] overflow-hidden p-6 sm:p-8 text-foreground"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-5 right-5 p-2 bg-muted hover:bg-muted/80 rounded-full transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>

              {/* Top Decorative Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-primary/10 blur-[50px] rounded-full pointer-events-none" />

              {/* Logo / Badge */}
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center font-black text-brand-navy text-2xl italic mb-6 shadow-lg shadow-primary/20">
                BH
              </div>

              {isIOS ? (
                /* iOS Safari instructions */
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-2">
                    Install BuildHub on iOS
                  </h3>
                  
                  <p className="text-muted-foreground text-sm font-medium mb-6">
                    Add BuildHub to your Home Screen for a premium app-like experience with quick access and full-screen workspace.
                  </p>

                  <div className="space-y-4 bg-muted/50 border border-border/60 rounded-3xl p-5 mb-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Share size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Step 1</p>
                        <p className="text-sm font-bold text-foreground">
                          Tap the <span className="font-extrabold text-primary">Share</span> button in the Safari navigation bar.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start border-t border-border/40 pt-4">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Plus size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Step 2</p>
                        <p className="text-sm font-bold text-foreground">
                          Scroll down the share sheet options and select <span className="font-extrabold text-primary">"Add to Home Screen"</span>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPopup(false)}
                    className="w-full bg-primary text-brand-navy py-4 rounded-2xl text-sm font-black shadow-yellow hover:bg-primary-dim active:scale-[0.98] transition-all cursor-pointer text-center block"
                  >
                    Got It
                  </button>
                </div>
              ) : showInstructions ? (
                /* Desktop/Android manual instructions fallback */
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-2">
                    How to Install BuildHub
                  </h3>

                  <p className="text-muted-foreground text-sm font-medium mb-6">
                    Add BuildHub to your desktop or mobile device for quick launch and offline capabilities.
                  </p>

                  <div className="space-y-4 bg-muted/50 border border-border/60 rounded-3xl p-5 mb-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Monitor size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">On Desktop (Chrome/Edge)</p>
                        <p className="text-sm font-bold text-foreground">
                          Look for the <span className="font-extrabold text-primary">Install</span> icon in the right side of the address bar, or click the browser menu (three dots) and select <span className="font-extrabold text-primary">"Install BuildHub"</span>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start border-t border-border/40 pt-4">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Smartphone size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">On Mobile (Android)</p>
                        <p className="text-sm font-bold text-foreground">
                          Tap the browser menu <span className="font-extrabold text-primary">(three dots)</span> on the top-right and select <span className="font-extrabold text-primary">"Install app"</span> or <span className="font-extrabold text-primary">"Add to Home screen"</span>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowInstructions(false)}
                      className="flex-1 bg-muted text-foreground hover:bg-muted/80 py-4 rounded-2xl text-sm font-black transition-all cursor-pointer text-center"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setShowPopup(false)}
                      className="flex-1 bg-primary text-brand-navy py-4 rounded-2xl text-sm font-black shadow-yellow hover:bg-primary-dim active:scale-[0.98] transition-all cursor-pointer text-center"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Android / Desktop Install Prompt */
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-2">
                    Download BuildHub App
                  </h3>

                  <p className="text-muted-foreground text-sm font-medium mb-6">
                    Get the native-like experience with offline capabilities, notifications, and lightning-fast launching.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-muted/50 border border-border/50 rounded-2xl p-4 flex flex-col gap-2 items-center text-center">
                      <Smartphone size={20} className="text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mobile App</span>
                    </div>
                    <div className="bg-muted/50 border border-border/50 rounded-2xl p-4 flex flex-col gap-2 items-center text-center">
                      <Monitor size={20} className="text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Desktop App</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={() => setShowPopup(false)}
                      className="flex-1 order-3 sm:order-1 bg-muted hover:bg-muted/80 text-foreground py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Later
                    </button>
                    
                    <button
                      onClick={() => setShowInstructions(true)}
                      className="flex-1 order-2 sm:order-2 bg-muted hover:bg-muted/80 text-primary border border-primary/20 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Instructions
                    </button>
                    
                    <button
                      onClick={installPWA}
                      className="flex-1 order-1 sm:order-3 bg-primary text-brand-navy py-4 rounded-2xl text-xs font-black uppercase tracking-wider shadow-yellow hover:bg-primary-dim active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} /> Install App
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PWAContext.Provider>
  );
};
