'use client'

import { Globe } from 'lucide-react'

import { MARKETS, type Market } from '@/lib/models'
import { useMarketStore } from '@/lib/store/market-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function MarketSelector() {
  const market = useMarketStore((s) => s.market)
  const setMarket = useMarketStore((s) => s.setMarket)

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
      <Select value={market} onValueChange={(v) => setMarket(v as Market)}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Select market" />
        </SelectTrigger>
        <SelectContent>
          {MARKETS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
