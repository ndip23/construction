import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  role: 'owner' | 'staff' | 'admin' | 'superadmin' | 'client';
  companyId?: string;
  company?: string;
  email: string;
  avatar?: string;
  slug: string; // The human-readable ID
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ 
          isAuthenticated: true, 
          user, 
          token 
        });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ 
          isAuthenticated: false, 
          user: null, 
          token: null 
        });
      },
    }),
    { 
      name: 'cpromark-storage', 
    }
  )
);