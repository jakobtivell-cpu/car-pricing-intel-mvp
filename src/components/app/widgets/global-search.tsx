'use client'

import * as React from 'react'
import { Search, Plus } from 'lucide-react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useMarketStore } from '@/lib/store/market-store'
import { useBasketStore } from '@/lib/store/basket-store'
import { searchSuggestions } from '@/lib/api/vehicles'
import { formatCurrency } from '@/lib/utils/format'

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function GlobalSearch() {
  const market = useMarketStore((s) => s.market)
  const add = useBasketStore((s) => s.add)

  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState('')
  const debounced = useDebounced(q, 140)
  const [items, setItems] = React.useState<{ id: string; label: string; msrp: number }[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const term = debounced.trim()
    if (!term) {
      setItems([])
      return
    }
    setLoading(true)
    searchSuggestions(term, market)
      .then((r) => setItems(r))
      .finally(() => setLoading(false))
  }, [debounced, market])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              const v = e.target.value
              setQ(v)
              setOpen(!!v.trim())
            }}
            onFocus={() => setOpen(!!q.trim())}
            placeholder="Search models, brands…"
            className="pl-9"
            aria-label="Global search"
          />
        </div>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[340px] p-2">
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="text-xs text-muted-foreground">Quick add to basket</div>
          <div className="text-[11px] text-muted-foreground">Enter to add first</div>
        </div>

        {loading ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">Searching…</div>
        ) : items.length ? (
          <div className="max-h-72 overflow-auto">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-ring"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  add(it.id)
                  setOpen(false)
                  setQ('')
                }}
              >
                <div>
                  <div className="font-medium">{it.label}</div>
                  <div className="text-xs text-muted-foreground">MSRP {formatCurrency(it.msrp, market)}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Plus className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-2 py-3 text-sm text-muted-foreground">No matches.</div>
        )}

        <div className="mt-2 border-t border-border pt-2 px-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!items.length}
            onClick={() => {
              if (!items.length) return
              add(items[0].id)
              setOpen(false)
              setQ('')
            }}
          >
            Add top result
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
