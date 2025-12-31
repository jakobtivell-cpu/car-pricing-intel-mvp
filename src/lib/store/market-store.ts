import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Market } from '@/lib/models'
import { safeLocalStorage } from '@/lib/store/storage'

type MarketState = {
  market: Market
  setMarket: (m: Market) => void
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set) => ({
      market: 'Sweden',
      setMarket: (market) => set({ market })
    }),
    {
      name: 'aurum-market',
      storage: createJSONStorage(() => safeLocalStorage())
    }
  )
)
