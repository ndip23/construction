import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasSeenTour: Record<string, boolean>;
  markTourSeen: (userId: string) => void;
  getHasSeenTour: (userId: string) => boolean;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasSeenTour: {},
      markTourSeen: (userId) =>
        set((s) => ({ hasSeenTour: { ...s.hasSeenTour, [userId]: true } })),
      getHasSeenTour: (userId) => get().hasSeenTour[userId] ?? false,
    }),
    { name: 'cpromark-onboarding' }
  )
);
