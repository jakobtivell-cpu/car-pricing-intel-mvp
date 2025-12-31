import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { safeLocalStorage } from '@/lib/store/storage'

export type ThemeMode = 'office' | 'colorful'

type ThemeState = {
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'office',
      setTheme: (theme) => set({ theme }),
      toggle: () => set({ theme: get().theme === 'office' ? 'colorful' : 'office' })
    }),
    {
      name: 'aurum-theme',
      storage: {
        getItem: (name) => safeLocalStorage().getItem(name),
        setItem: (name, value) => safeLocalStorage().setItem(name, value),
        removeItem: (name) => safeLocalStorage().removeItem(name)
      }
    }
  )
)
