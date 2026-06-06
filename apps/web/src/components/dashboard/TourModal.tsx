import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Flag, Target, Zap, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useOnboardingStore } from '../../store/useOnboardingStore';
import confetti from 'canvas-confetti';

const TOUR_STEPS = [
  {
    title: 'Welcome to Cpromark! 🎉',
    description: "You've successfully completed your workspace setup. Your public profile is live and you're ready to start receiving leads. Let's take a quick tour of your new command center.",
    icon: Flag,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    title: 'Track Your Project Pulse',
    description: 'The Project Pulse area gives you real-time oversight of all active sites. You can track budgets, progress milestones, and daily field reports right from your dashboard.',
    icon: Target,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  {
    title: 'Discover Leads & Tenders',
    description: "Whenever a client views your public profile or sends a message, it will appear in your 'Inquiries' tab. Keep an eye on 'Tenders' for new public project bids.",
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    title: "You're All Set! 🚀",
    description: 'Your workspace is fully operational. Remember to keep your marketplace products updated and explore the AI Hub for engineering insights.',
    icon: CheckCircle2,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10'
  }
];

export const TourModal = () => {
  const { user } = useAuthStore();
  const { markTourSeen } = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (user?.id) {
      markTourSeen(user.id);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b']
      });
    }
  };

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleComplete}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-card border border-border rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl z-10 overflow-hidden"
      >
        <button 
          onClick={handleComplete}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 ${step.bg} ${step.color}`}>
            <Icon size={40} />
          </div>

          <h2 className="text-2xl font-black text-foreground mb-3">{step.title}</h2>
          <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-10 px-4">
            {step.description}
          </p>

          <div className="flex items-center gap-2 mb-8">
            {TOUR_STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between w-full gap-4">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
                currentStep === 0 ? 'opacity-0 pointer-events-none' : 'bg-muted text-foreground hover:bg-border'
              }`}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={handleNext}
              className="bg-primary text-brand-navy px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] shadow-yellow transition-all"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
