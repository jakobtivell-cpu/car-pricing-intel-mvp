import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { safeLocalStorage } from '@/lib/store/storage'

export type User = {
  id: string
  name: string
  email: string
  org: string
  role: 'Analyst' | 'Manager' | 'Admin'
}

type AuthState = {
  user: User | null
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (email, password) => {
        await new Promise((r) => setTimeout(r, 550))

        if (!email.includes('@') || password.trim().length < 2) {
          return { ok: false, error: 'Enter a valid email and any password (mock auth).' }
        }

        const user: User = {
          id: 'u_demo_01',
          name: 'Jakob Tivell',
          email,
          org: 'Egaux AB',
          role: 'Admin'
        }

        set({ user })
        return { ok: true }
      },
      logout: () => set({ user: null })
    }),
    {
      name: 'aurum-auth',
      storage: {
        getItem: (name) => safeLocalStorage().getItem(name),
        setItem: (name, value) => safeLocalStorage().setItem(name, value),
        removeItem: (name) => safeLocalStorage().removeItem(name)
      }
    }
  )
)
