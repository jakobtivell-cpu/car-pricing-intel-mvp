'use client'

import * as React from 'react'

import { Area, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { CalendarClock, Filter, Sparkles } from 'lucide-react'

import type { CampaignType } from '@/lib/models'
import { useBasketStore } from '@/lib/store/basket-store'
import { useMarketStore } from '@/lib/store/market-store'
import { useAsync } from '@/lib/utils/use-async'
import { getVehiclesByIds } from '@/lib/api/vehicles'
import { getCampaigns, getActiveDeals, promoIntensityIndex } from '@/lib/api/campaigns'
import { getPriceHistory } from '@/lib/api/pricing'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { CampaignTimeline } from '@/components/charts/campaign-timeline'

const ALL_TYPES: CampaignType[] = ['Cash', 'Lease', 'APR', 'Bundle', 'Fleet']

export function TacticalPricingPage() {
  const market = useMarketStore((s) => s.market)
  const vehicleIds = useBasketStore((s) => s.vehicleIds)

  const [months, setMonths] = React.useState<'6' | '12' | '24'>('12')
  const [types, setTypes] = React.useState<CampaignType[]>(ALL_TYPES)

  const dateRange = React.useMemo(() => rangeForMonths(Number(months)), [months])

  const { data, loading, error, refetch } = useAsync(async () => {
    const vehicles = await getVehiclesByIds(vehicleIds, market)
    const campaigns = await getCampaigns({ vehicleIds, market, types, dateRange: { from: dateRange.fromISO, to: dateRange.toISO } })
    const price = await getPriceHistory({ vehicleIds, market, dateRange: { fromMonth: dateRange.fromMonth, toMonth: dateRange.toMonth } })
    return { vehicles, campaigns, price }
  }, [vehicleIds.join('|'), market, types.join('|'), months])

  const vehicles = data?.vehicles ?? []
  const campaigns = data?.campaigns ?? []
  const price = data?.price ?? {}

  const active = getActiveDeals(campaigns)

  const timelineVehicles = vehicles.map((v) => ({ id: v.id, label: `${v.brand} ${v.model}` }))

  // chart data: merge by month with bucket per vehicle
  const priceChart = React.useMemo(() => {
    const months = new Set<string>()
    for (const id of vehicleIds) {
      for (const p of price[id] ?? []) months.add(p.month)
    }
    const ordered = Array.from(months).sort()
    return ordered.map((month) => {
      const row: any = { month }
      for (const id of vehicleIds) {
        const p = (price[id] ?? []).find((x) => x.month === month)
        row[`${id}_msrp`] = p?.msrp
        row[`${id}_tx`] = p?.transaction
        row[`${id}_inc`] = p?.incentive
      }
      return row
    })
  }, [price, vehicleIds])

  if (!vehicleIds.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tactical Pricing</CardTitle>
          <CardDescription>Add 1+ vehicles to the basket to analyze campaigns and price moves.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/">Go to Model Picker</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Tactical Pricing</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Campaigns & promo history</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Compare promotional intensity and how MSRP, transaction price estimates, and incentives moved over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
            <Select value={months} onValueChange={(v) => setMonths(v as any)}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 24 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Campaign types
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Show types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_TYPES.map((t) => (
                <DropdownMenuCheckboxItem
                  key={t}
                  checked={types.includes(t)}
                  onCheckedChange={(checked) => {
                    setTypes((prev) => {
                      const set = new Set(prev)
                      checked ? set.add(t) : set.delete(t)
                      return Array.from(set)
                    })
                  }}
                >
                  {t}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {error ? (
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Campaign timeline</CardTitle>
            <CardDescription>
              Gantt-style view. Hover a bar for details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: Math.min(6, vehicleIds.length) }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <CampaignTimeline
                campaigns={campaigns}
                vehicles={timelineVehicles}
                fromISO={dateRange.fromISO}
                toISO={dateRange.toISO}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current deals</CardTitle>
            <CardDescription>Deals active as of today (mock).</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : active.length ? (
              <div className="space-y-2">
                {active.slice(0, 8).map((c) => {
                  const v = vehicles.find((x) => x.id === c.vehicleId)
                  return (
                    <div key={c.id} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {v ? `${v.brand} ${v.model}` : c.vehicleId}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {c.title} • {c.start} → {c.end}
                          </div>
                        </div>
                        <Badge variant="accent">{c.type}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <div className="rounded-md border border-border bg-muted px-2 py-1 mono-num">
                          -{c.discountPct}%
                        </div>
                        <div className="rounded-md border border-border bg-muted px-2 py-1 mono-num">
                          {c.cashIncentive} cash
                        </div>
                        {c.leaseFrom ? (
                          <div className="rounded-md border border-border bg-muted px-2 py-1 mono-num">
                            {c.leaseFrom}/mo
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
                No active deals in this selection.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Price history</CardTitle>
              <CardDescription>MSRP vs transaction estimate vs incentive level</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              Theme-safe colors: series come from chart tokens.
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-4">
              <div className="font-medium">{error}</div>
              <div className="mt-2 text-sm text-muted-foreground">Try again — this is a simulated network.</div>
              <Button className="mt-3" onClick={refetch}>
                Retry
              </Button>
            </div>
          ) : null}

          <div className={cn('h-[380px]', loading ? 'opacity-60' : '')}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={priceChart} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RTooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10 }}
                />
                <Legend />

                {vehicleIds.map((id, i) => (
                  <Line
                    key={`${id}-tx`}
                    type="monotone"
                    dataKey={`${id}_tx`}
                    name={`${labelFor(vehicles, id)} Tx`}
                    stroke={`hsl(var(--chart-${(i % 6) + 1}))`}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                  />
                ))}

                {vehicleIds.map((id, i) => (
                  <Area
                    key={`${id}-inc`}
                    type="monotone"
                    dataKey={`${id}_inc`}
                    name={`${labelFor(vehicles, id)} Incentive`}
                    fill={`hsl(var(--chart-${(i % 6) + 1}) / 0.12)`}
                    stroke={`hsl(var(--chart-${(i % 6) + 1}))`}
                    isAnimationActive
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {vehicles.map((v, i) => {
              const vCampaigns = campaigns.filter((c) => c.vehicleId === v.id)
              const idx = promoIntensityIndex(vCampaigns)
              return (
                <div key={v.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{v.brand} {v.model}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {v.trim} • MSRP {formatCurrency(v.pricing[market].msrp, market)}
                      </div>
                    </div>
                    <Badge variant={idx >= 8 ? 'warning' : idx >= 4 ? 'accent' : 'default'} className="mono-num">
                      {idx}
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Promo intensity index (90d): higher = more deals.
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function rangeForMonths(months: number) {
  const to = new Date('2025-12-31')
  const from = new Date(to)
  from.setMonth(from.getMonth() - months)

  const toISO = to.toISOString().slice(0, 10)
  const fromISO = from.toISOString().slice(0, 10)

  const toMonth = toISO.slice(0, 7)
  const fromMonth = fromISO.slice(0, 7)

  return { fromISO, toISO, fromMonth, toMonth }
}

function labelFor(vehicles: any[], id: string) {
  const v = vehicles.find((x) => x.id === id)
  return v ? `${v.brand} ${v.model}` : id
}
