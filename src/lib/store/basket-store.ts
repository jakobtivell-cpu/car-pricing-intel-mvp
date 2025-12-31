import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { safeLocalStorage } from '@/lib/store/storage'

export type SavedBasket = {
  id: string
  name: string
  vehicleIds: string[]
  createdAt: string
}

type BasketState = {
  vehicleIds: string[]
  saved: SavedBasket[]
  add: (vehicleId: string) => void
  remove: (vehicleId: string) => void
  clear: () => void
  reorder: (ordered: string[]) => void
  saveCurrent: (name: string) => SavedBasket
  load: (id: string) => void
  deleteSaved: (id: string) => void
}

export const useBasketStore = create<BasketState>()(
  persist(
    (set, get) => ({
      vehicleIds: [],
      saved: [],
      add: (vehicleId) =>
        set((s) =>
          s.vehicleIds.includes(vehicleId)
            ? s
            : { ...s, vehicleIds: [...s.vehicleIds, vehicleId] }
        ),
      remove: (vehicleId) =>
        set((s) => ({ ...s, vehicleIds: s.vehicleIds.filter((id) => id !== vehicleId) })),
      clear: () => set((s) => ({ ...s, vehicleIds: [] })),
      reorder: (ordered) => set((s) => ({ ...s, vehicleIds: ordered })),
      saveCurrent: (name) => {
        const entry: SavedBasket = {
          id: nanoid(10),
          name: name.trim() || `Basket ${get().saved.length + 1}`,
          vehicleIds: [...get().vehicleIds],
          createdAt: new Date().toISOString()
        }
        set((s) => ({ ...s, saved: [entry, ...s.saved] }))
        return entry
      },
      load: (id) => {
        const found = get().saved.find((b) => b.id === id)
        if (!found) return
        set((s) => ({ ...s, vehicleIds: [...found.vehicleIds] }))
      },
      deleteSaved: (id) => set((s) => ({ ...s, saved: s.saved.filter((b) => b.id !== id) }))
    }),
    {
      name: 'aurum-basket',
      storage: {
        getItem: (name) => safeLocalStorage().getItem(name),
        setItem: (name, value) => safeLocalStorage().setItem(name, value),
        removeItem: (name) => safeLocalStorage().removeItem(name)
      }
    }
  )
)
