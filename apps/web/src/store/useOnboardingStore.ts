import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Ordered onboarding steps every new owner must complete.
 * Once a step is marked done it can never regress.
 *
 * wallet   → top-up the workspace wallet
 * profile  → fill in the business profile
 * service  → add at least one service
 * product  → add at least one product to the marketplace
 * tour     → watch the quick tour
 * done     → fully onboarded, no more gates
 */
export type OnboardingStep = 'wallet' | 'profile' | 'service' | 'product' | 'tour' | 'done';

const STEP_ORDER: OnboardingStep[] = ['wallet', 'profile', 'service', 'product', 'tour', 'done'];

interface OnboardingState {
  /** keyed by userId so multiple accounts on the same browser don't interfere */
  progress: Record<string, OnboardingStep>;
  getStep: (userId: string) => OnboardingStep;
  advance: (userId: string) => void;
  markDone: (userId: string) => void;
  isDone: (userId: string) => boolean;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      progress: {},

      getStep: (userId) => get().progress[userId] ?? 'wallet',

      advance: (userId) => {
        const current = get().progress[userId] ?? 'wallet';
        const idx = STEP_ORDER.indexOf(current);
        const next = STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
        set((s) => ({ progress: { ...s.progress, [userId]: next } }));
      },

      markDone: (userId) =>
        set((s) => ({ progress: { ...s.progress, [userId]: 'done' } })),

      isDone: (userId) => (get().progress[userId] ?? 'wallet') === 'done',
    }),
    { name: 'buildhub-onboarding' }
  )
);
