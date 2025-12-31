'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core'
import { Plus, Search, SlidersHorizontal, X, Sparkles } from 'lucide-react'

import { getAllBrands, getAllBodyTypes, getAllSegments } from '@/data/mock'
import type { BodyType, Drivetrain, Market, Powertrain, Segment, SortKey } from '@/lib/models'
import { BODY_TYPES, DRIVETRAINS, POWERTRAINS, SEGMENTS } from '@/lib/models'
import { useFiltersStore } from '@/lib/store/filters-store'
import { useBasketStore } from '@/lib/store/basket-store'
import { useMarketStore } from '@/lib/store/market-store'
import { listVehicles } from '@/lib/api/vehicles'
import { useAsync } from '@/lib/utils/use-async'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Skeleton } from '@/components/ui/skeleton'

function FilterGroup({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CheckRow({
  label,
  checked,
  onCheckedChange
}: {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
      <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(Boolean(v))} />
      <span className="text-sm">{label}</span>
    </label>
  )
}

function BasketDropZone() {
  const { isOver, setNodeRef } = useDroppable({ id: 'basket-drop' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'pointer-events-none fixed bottom-6 right-6 z-30 hidden lg:block rounded-xl border border-border bg-card/80 px-4 py-3 shadow-float backdrop-blur transition',
        isOver ? 'ring-2 ring-accent' : 'ring-0'
      )}
      aria-hidden
    >
      <div className="pointer-events-none flex items-center gap-2 text-sm">
        <div className="h-8 w-8 rounded-lg bg-accent/15 grid place-items-center">
          <Plus className="h-4 w-4 text-accent" />
        </div>
        <div>
          <div className="font-medium">Drop to add</div>
          <div className="text-xs text-muted-foreground">Basket</div>
        </div>
      </div>
    </div>
  )
}

function DraggableVehicleCard({
  v,
  market,
  onAdd
}: {
  v: Awaited<ReturnType<typeof listVehicles>>['items'][number]
  market: Market
  onAdd: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: v.id })
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
  }

  const headline = `${v.brand} ${v.model}`

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <HoverCard openDelay={380} closeDelay={120}>
        <HoverCardTrigger asChild>
          <div
            className={cn(
              'group card-surface p-4 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-float',
              isDragging ? 'opacity-70' : ''
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-tight">{headline}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {v.trim} • {v.year} • {v.bodyType} • {v.drivetrain}
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
                aria-label={`Add ${headline} to basket`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="accent">{v.powertrain}</Badge>
              {v.rangeKm ? <Badge>Range {v.rangeKm} km</Badge> : <Badge>Range —</Badge>}
              <Badge>MSRP {formatCurrency(v.msrp, market)}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Kpi label="0–100" value={`${v.zeroToHundred.toFixed(1)}s`} />
              <Kpi label="Power" value={`${v.horsepower} hp`} />
              <Kpi label="Weight" value={`${formatNumber(v.curbWeightKg)} kg`} />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Hover for snapshot
              </div>
              <div className="mono-num">Txn {formatCurrency(v.transactionEstimate, market)}</div>
            </div>
          </div>
        </HoverCardTrigger>

        <HoverCardContent align="start" className="w-[360px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">{headline}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{v.trim} • {v.year}</div>
            </div>
            <Badge variant="accent">{v.powertrain}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Spec label="Battery" value={v.batteryKwh ? `${v.batteryKwh} kWh` : '—'} />
            <Spec label="Torque" value={`${v.torqueNm} Nm`} />
            <Spec label="Dimensions" value={`${v.lengthMm}×${v.widthMm}×${v.heightMm} mm`} />
            <Spec label="Incentives" value={formatCurrency(v.incentives, market)} />
          </div>
          <div className="mt-3 rounded-md border border-border bg-muted/40 p-2">
            <div className="text-xs font-medium">Packages</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {v.packages.slice(0, 4).join(' • ')}
              {v.packages.length > 4 ? ' …' : ''}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 mono-num text-sm font-semibold">{value}</div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mono-num font-medium">{value}</div>
    </div>
  )
}

export function ModelPickerPage() {
  const market = useMarketStore((s) => s.market)
  const { filters, set, reset } = useFiltersStore()
  const basketIds = useBasketStore((s) => s.vehicleIds)
  const add = useBasketStore((s) => s.add)

  const { data, loading, error, refetch } = useAsync(
    () =>
      listVehicles({
        market,
        filters: {
          brands: filters.brands,
          bodyTypes: filters.bodyTypes,
          powertrains: filters.powertrains,
          drivetrains: filters.drivetrains,
          segments: filters.segments,
          price: filters.price,
          search: filters.search
        },
        sort: filters.sort
      }),
    [market, JSON.stringify(filters)]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const items = data?.items ?? []

  function onDragEnd(e: DragEndEvent) {
    if (!e.over) return
    if (e.over.id !== 'basket-drop') return
    const id = String(e.active.id)
    add(id)
  }

  const brands = React.useMemo(() => getAllBrands(), [])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Model Picker</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Build a comparison basket</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Filter the market, scan highlights, and build a basket for deep comparison across specs, pricing, campaigns, and volume.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <SortSelect value={filters.sort} onChange={(v) => set('sort', v)} />
          </div>
          <Button type="button" variant="outline" onClick={reset}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Link href="/product-data" className="focus-ring rounded-md">
            <Button type="button" disabled={basketIds.length < 2}>
              Compare ({basketIds.length})
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Refine the market set realistically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(e) => set('search', e.target.value)}
                  placeholder="Brand, model, trim…"
                  className="pl-9"
                />
                {filters.search ? (
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted focus-ring"
                    onClick={() => set('search', '')}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <FilterGroup title="Brand">
              <div className="max-h-40 overflow-auto pr-1">
                {brands.map((b) => (
                  <CheckRow
                    key={b}
                    label={b}
                    checked={filters.brands.includes(b)}
                    onCheckedChange={(v) => {
                      const next = v ? [...filters.brands, b] : filters.brands.filter((x) => x !== b)
                      set('brands', next)
                    }}
                  />
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Body type">
              {BODY_TYPES.map((b) => (
                <CheckRow
                  key={b}
                  label={b}
                  checked={filters.bodyTypes.includes(b)}
                  onCheckedChange={(v) => {
                    const next = v ? [...filters.bodyTypes, b] : filters.bodyTypes.filter((x) => x !== b)
                    set('bodyTypes', next)
                  }}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Powertrain">
              {POWERTRAINS.map((p) => (
                <CheckRow
                  key={p}
                  label={p}
                  checked={filters.powertrains.includes(p)}
                  onCheckedChange={(v) => {
                    const next = v ? [...filters.powertrains, p] : filters.powertrains.filter((x) => x !== p)
                    set('powertrains', next)
                  }}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Drivetrain">
              {DRIVETRAINS.map((d) => (
                <CheckRow
                  key={d}
                  label={d}
                  checked={filters.drivetrains.includes(d)}
                  onCheckedChange={(v) => {
                    const next = v ? [...filters.drivetrains, d] : filters.drivetrains.filter((x) => x !== d)
                    set('drivetrains', next)
                  }}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Segment">
              {SEGMENTS.map((s) => (
                <CheckRow
                  key={s}
                  label={s}
                  checked={filters.segments.includes(s)}
                  onCheckedChange={(v) => {
                    const next = v ? [...filters.segments, s] : filters.segments.filter((x) => x !== s)
                    set('segments', next)
                  }}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="MSRP range">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(filters.price[0], market)}</span>
                  <span>{formatCurrency(filters.price[1], market)}</span>
                </div>
                <Slider
                  value={filters.price}
                  min={200000}
                  max={950000}
                  step={10000}
                  onValueChange={(v) => set('price', [v[0], v[1]])}
                />
              </div>
            </FilterGroup>

            <div className="sm:hidden">
              <SortSelect value={filters.sort} onChange={(v) => set('sort', v)} />
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {loading ? 'Loading vehicles…' : error ? 'Error loading vehicles' : `${items.length} vehicles`}
            </div>
            {error ? (
              <Button type="button" variant="outline" onClick={refetch}>
                Retry
              </Button>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-[210px]" />
              ))}
            </div>
          ) : error ? (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>We hit a mock network error</CardTitle>
                <CardDescription>Try again — this exists so the UI has real error states.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">{error}</div>
                <Button className="mt-4" onClick={refetch}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>No matches</CardTitle>
                <CardDescription>Broaden filters or clear search.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={reset}>
                  Reset filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((v) => (
                  <DraggableVehicleCard key={v.id} v={v} market={market} onAdd={() => add(v.id)} />
                ))}
              </div>
              <BasketDropZone />
            </DndContext>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Pro tip: drag a card (desktop) onto the “Drop to add” chip, or use the + button.
      </div>
    </div>
  )
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs font-semibold text-muted-foreground">Sort</div>
      <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="msrp">MSRP (low → high)</SelectItem>
          <SelectItem value="range">Range (high → low)</SelectItem>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="volume">Sales volume</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
