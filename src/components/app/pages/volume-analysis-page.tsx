'use client'

import * as React from 'react'

import { Area, AreaChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react'

import { VEHICLES, getAllSegments } from '@/data/mock'
import type { Market, Segment, VolumePoint } from '@/lib/models'
import { useBasketStore } from '@/lib/store/basket-store'
import { useMarketStore } from '@/lib/store/market-store'
import { useAsync } from '@/lib/utils/use-async'
import { getVolumeHistory, pickCompetitors } from '@/lib/api/volume'
import { getVehiclesByIds } from '@/lib/api/vehicles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { formatNumber, formatPct } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export function VolumeAnalysisPage() {
  const market = useMarketStore((s) => s.market)
  const basket = useBasketStore((s) => s.vehicleIds)

  const [months, setMonths] = React.useState<12 | 24 | 36>(24)
  const [segment, setSegment] = React.useState<Segment | 'All'>('All')
  const [indexed, setIndexed] = React.useState(false)

  const competitors = React.useMemo(() => pickCompetitors(basket, 3), [basket])
  const ids = React.useMemo(() => [...basket, ...competitors], [basket, competitors])

  const range = React.useMemo(() => rangeForMonths(months), [months])

  const vRes = useAsync(() => getVolumeHistory({ vehicleIds: ids, market, dateRange: range }), [ids.join('|'), market, months])
  const vehicleRes = useAsync(() => getVehiclesByIds(ids, market), [ids.join('|'), market])

  const vehicles = vehicleRes.data ?? []

  const filteredVehicles = React.useMemo(() => {
    if (segment === 'All') return vehicles
    return vehicles.filter((v) => v.segment === segment)
  }, [vehicles, segment])

  const series = vRes.data ?? {}

  const rows = React.useMemo(() => {
    const keys = filteredVehicles.map((v) => v.id)
    const monthsArr = (series[keys[0]] ?? []).map((p) => p.month)

    return monthsArr.map((m) => {
      const obj: any = { month: m }
      for (const v of filteredVehicles) {
        const point = (series[v.id] ?? []).find((p) => p.month === m)
        obj[v.id] = point?.registrations ?? 0
      }
      return obj
    })
  }, [filteredVehicles, series])

  const shareRows = React.useMemo(() => {
    const keys = filteredVehicles.map((v) => v.id)
    const monthsArr = (series[keys[0]] ?? []).map((p) => p.month)

    return monthsArr.map((m) => {
      const obj: any = { month: m }
      let sum = 0
      for (const v of filteredVehicles) {
        const point = (series[v.id] ?? []).find((p) => p.month === m)
        const share = point?.segmentShare ?? 0
        obj[v.id] = share
        sum += share
      }
      obj.other = Math.max(0, 1 - sum)
      return obj
    })
  }, [filteredVehicles, series])

  const displayRows = React.useMemo(() => {
    if (!indexed) return rows
    const base: Record<string, number> = {}
    const first = rows[0]
    if (!first) return rows
    for (const v of filteredVehicles) {
      base[v.id] = first[v.id] || 1
    }

    return rows.map((r) => {
      const obj: any = { month: r.month }
      for (const v of filteredVehicles) {
        obj[v.id] = Math.round((r[v.id] / base[v.id]) * 100)
      }
      return obj
    })
  }, [indexed, rows, filteredVehicles])

  const insights = React.useMemo(() => buildInsights(filteredVehicles, series), [filteredVehicles, series])
  const kpis = React.useMemo(() => buildKpis(filteredVehicles, series, market), [filteredVehicles, series, market])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Volume Analysis</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Demand signals, share, and momentum.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Compare registrations and segment share over time. Toggle indexed view to normalize trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-muted-foreground">Range</div>
            <Select value={String(months)} onValueChange={(v) => setMonths(Number(v) as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 mo</SelectItem>
                <SelectItem value="24">24 mo</SelectItem>
                <SelectItem value="36">36 mo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-muted-foreground">Segment</div>
            <Select value={segment} onValueChange={(v) => setSegment(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {getAllSegments().map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" variant={indexed ? 'default' : 'outline'} onClick={() => setIndexed((v) => !v)}>
            {indexed ? 'Indexed (100)' : 'Absolute'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Registrations</CardTitle>
            <CardDescription>
              {indexed ? 'Indexed to 100 at start of range.' : 'Monthly registrations (mock).'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="mono-num">
              Basket {basket.length}
            </Badge>
            <Badge className="mono-num">Bench {competitors.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {vRes.loading || vehicleRes.loading ? (
            <div className="h-[320px] rounded-lg bg-muted animate-pulse" />
          ) : vRes.error || vehicleRes.error ? (
            <div className="rounded-lg border border-danger/30 bg-danger/10 p-4">
              <div className="text-sm font-medium">Could not load volume data.</div>
              <div className="mt-1 text-sm text-muted-foreground">{vRes.error ?? vehicleRes.error}</div>
              <div className="mt-3">
                <Button type="button" variant="outline" onClick={() => vRes.refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : !filteredVehicles.length ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="text-sm font-medium">No vehicles match the filters.</div>
              <div className="mt-1 text-sm text-muted-foreground">Try a different segment.</div>
            </div>
          ) : (
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayRows} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RTooltip contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Legend />
                  {filteredVehicles.map((v, idx) => (
                    <Line
                      key={v.id}
                      type="monotone"
                      dataKey={v.id}
                      name={shortLabel(v)}
                      stroke={`hsl(var(--chart-${(idx % 6) + 1}))`}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Segment share</CardTitle>
            <CardDescription>Stacked share contribution (basket + benchmarks + other).</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={shareRows} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fontSize: 12 }} />
                  <RTooltip
                    formatter={(v: any) => `${Math.round(Number(v) * 100)}%`}
                    contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Legend />
                  {filteredVehicles.map((v, idx) => (
                    <Area
                      key={v.id}
                      type="monotone"
                      dataKey={v.id}
                      name={shortLabel(v)}
                      stackId="1"
                      stroke={`hsl(var(--chart-${(idx % 6) + 1}))`}
                      fill={`hsl(var(--chart-${(idx % 6) + 1}) / 0.25)`}
                      isAnimationActive
                    />
                  ))}
                  <Area
                    type="monotone"
                    dataKey="other"
                    name="Other"
                    stackId="1"
                    stroke="hsl(var(--border))"
                    fill="hsl(var(--border) / 0.35)"
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Insight callouts
              </CardTitle>
              <CardDescription>Simple rules, useful signal.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {insights.length ? (
                <div className="space-y-2">
                  {insights.map((i, idx) => (
                    <div key={idx} className="rounded-lg border border-border bg-card p-3">
                      <div className="text-sm font-medium">{i.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{i.body}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                  No standout patterns in this slice.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Momentum table</CardTitle>
              <CardDescription>MoM / YoY, plus approximate segment rank.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {kpis.map((k) => (
                  <div key={k.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{k.name}</div>
                      <Badge variant={k.kind} className="mono-num">
                        Rank {k.rank}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <Metric label="Latest" value={formatNumber(k.latest)} />
                      <Metric label="MoM" value={k.momLabel} delta={k.mom} />
                      <Metric label="YoY" value={k.yoyLabel} delta={k.yoy} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />
      <div className="text-xs text-muted-foreground">
        Benchmarks are automatically picked from similar segment/powertrain vehicles in the mock dataset.
      </div>
    </div>
  )
}

type Insight = { title: string; body: string }

function Metric({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const up = typeof delta === 'number' && delta > 0
  const down = typeof delta === 'number' && delta < 0

  return (
    <div className="rounded-md border border-border bg-card p-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-1 text-sm font-semibold">
        {up ? <ArrowUpRight className="h-4 w-4 text-success" /> : null}
        {down ? <ArrowDownRight className="h-4 w-4 text-danger" /> : null}
        <span className={cn('mono-num', up ? 'text-success' : down ? 'text-danger' : 'text-fg')}>{value}</span>
      </div>
    </div>
  )
}

function rangeForMonths(months: number) {
  const to = new Date('2025-12-31')
  const from = new Date(to)
  from.setMonth(from.getMonth() - months)

  const toMonth = to.toISOString().slice(0, 7)
  const fromMonth = from.toISOString().slice(0, 7)
  return { fromMonth, toMonth }
}

function shortLabel(v: any) {
  return `${v.brand} ${v.model}`
}

function buildInsights(vehicles: any[], series: Record<string, VolumePoint[]>): Insight[] {
  if (!vehicles.length) return []

  const insights: Insight[] = []

  for (const v of vehicles) {
    const points = series[v.id] ?? []
    const last6 = points.slice(-6)
    if (last6.length < 6) continue

    // Rule: 3 consecutive months share gain
    const gains = last6
      .map((p, i) => {
        if (i === 0) return 0
        return p.segmentShare - last6[i - 1].segmentShare
      })
      .slice(1)

    const threeUp = gains.slice(-3).every((g) => g > 0)
    if (threeUp) {
      insights.push({
        title: `${shortLabel(v)} gained share 3 months in a row`,
        body: `A sustained upward pattern in segment share over the most recent quarter.`
      })
    }

    // Rule: big MoM jump
    const prev = points.at(-2)
    const last = points.at(-1)
    if (prev && last) {
      const mom = (last.registrations - prev.registrations) / Math.max(1, prev.registrations)
      if (mom > 0.18) {
        insights.push({
          title: `${shortLabel(v)} spiked +${Math.round(mom * 100)}% MoM`,
          body: `Worth cross-checking against campaigns and incentives for timing alignment.`
        })
      }
    }
  }

  return insights.slice(0, 4)
}

function buildKpis(vehicles: any[], series: Record<string, VolumePoint[]>, market: Market) {
  // Segment rank approximation: compare against ALL vehicles' latest month in same segment.
  const latestMonth = Object.values(series)[0]?.at(-1)?.month

  const allLatestBySegment: Record<string, { id: string; seg: string; val: number }[]> = {}
  if (latestMonth) {
    for (const v of VEHICLES) {
      const p = (series[v.id] ?? []).find((x) => x.month === latestMonth)
      const val = p?.registrations ?? 0
      const seg = v.segment
      allLatestBySegment[seg] ||= []
      allLatestBySegment[seg].push({ id: v.id, seg, val })
    }
    for (const seg of Object.keys(allLatestBySegment)) {
      allLatestBySegment[seg].sort((a, b) => b.val - a.val)
    }
  }

  return vehicles.map((v) => {
    const pts = series[v.id] ?? []
    const latest = pts.at(-1)
    const prev = pts.at(-2)
    const lastYear = pts.at(-13)

    const mom = latest && prev ? (latest.registrations - prev.registrations) / Math.max(1, prev.registrations) : 0
    const yoy = latest && lastYear ? (latest.registrations - lastYear.registrations) / Math.max(1, lastYear.registrations) : 0

    const segList = allLatestBySegment[v.segment] ?? []
    const rank = segList.findIndex((x) => x.id === v.id) + 1

    return {
      id: v.id,
      name: shortLabel(v),
      latest: latest?.registrations ?? 0,
      mom,
      yoy,
      momLabel: `${Math.round(mom * 100)}%`,
      yoyLabel: `${Math.round(yoy * 100)}%`,
      rank: rank || '—',
      kind: mom > 0.04 ? 'success' : mom < -0.04 ? 'danger' : 'default'
    }
  })
}
