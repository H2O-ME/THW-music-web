import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isLoginModalOpen: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoginModalOpen: (isOpen: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoginModalOpen: false,

      setUser: (user) => set({ user }),
      setLoginModalOpen: (isLoginModalOpen) => set({ isLoginModalOpen }),
      logout: () => {
        set({ user: null })
        // Clear all persisted state
        localStorage.removeItem('thw-music-auth')
      },
    }),
    {
      name: 'thw-music-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
