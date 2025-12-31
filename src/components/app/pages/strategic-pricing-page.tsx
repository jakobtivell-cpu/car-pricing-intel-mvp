'use client'

import * as React from 'react'

import Link from 'next/link'
import { Info, Sparkles } from 'lucide-react'
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'

import { useBasketStore } from '@/lib/store/basket-store'
import { useMarketStore } from '@/lib/store/market-store'
import { useAsync } from '@/lib/utils/use-async'
import { getVehiclesByIds } from '@/lib/api/vehicles'
import type { VehicleByMarket } from '@/lib/models'
import { minMax, normalize01, round } from '@/lib/utils/stats'
import { formatCurrency } from '@/lib/utils/format'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { EmptyBasket } from '@/components/app/states/empty-basket'
import { ErrorState } from '@/components/app/states/error-state'
import { LoadingBlock } from '@/components/app/states/loading'

type AttributeKey = 'range' | 'accel' | 'power' | 'features' | 'price'

type Attribute = {
  key: AttributeKey
  label: string
  description: string
  better: 'high' | 'low'
}

const ATTRIBUTES: Attribute[] = [
  {
    key: 'range',
    label: 'Range',
    description: 'Customer-perceived driving freedom (higher is better).',
    better: 'high'
  },
  {
    key: 'accel',
    label: '0–100 km/h',
    description: 'Acceleration proxy for performance feel (lower is better).',
    better: 'low'
  },
  {
    key: 'power',
    label: 'Horsepower',
    description: 'Power output for overtakes + highway confidence (higher is better).',
    better: 'high'
  },
  {
    key: 'features',
    label: 'Feature richness',
    description: 'Proxy: packages + options breadth (higher is better).',
    better: 'high'
  },
  {
    key: 'price',
    label: 'Affordability',
    description: 'Proxy: MSRP attractiveness (lower price scores higher).',
    better: 'low'
  }
]

const PRESETS: Record<string, Partial<Record<AttributeKey, number>>> = {
  Family: { range: 30, accel: 10, power: 10, features: 20, price: 30 },
  Performance: { range: 15, accel: 35, power: 30, features: 10, price: 10 },
  'EV-first': { range: 40, accel: 15, power: 10, features: 15, price: 20 },
  Budget: { range: 20, accel: 10, power: 5, features: 15, price: 50 }
}

function normalizeWeights(w: Record<AttributeKey, number>) {
  const sum = Object.values(w).reduce((a, b) => a + b, 0)
  if (sum === 0) {
    const equal = 100 / ATTRIBUTES.length
    return Object.fromEntries(ATTRIBUTES.map((a) => [a.key, equal])) as Record<AttributeKey, number>
  }
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, (v / sum) * 100])) as Record<AttributeKey, number>
}

export function StrategicPricingPage() {
  const market = useMarketStore((s) => s.market)
  const vehicleIds = useBasketStore((s) => s.vehicleIds)

  const { data, error, loading, refetch } = useAsync(() => getVehiclesByIds(vehicleIds, market), [vehicleIds.join('|'), market])
  const vehicles = data ?? []

  const [weights, setWeights] = React.useState<Record<AttributeKey, number>>(() => normalizeWeights({
    range: 30,
    accel: 15,
    power: 15,
    features: 20,
    price: 20
  }))

  const prev = React.useRef<{ weights: Record<AttributeKey, number>; scores: Record<string, number> } | null>(null)

  const { scores, breakdown } = React.useMemo(() => {
    const outScores: Record<string, number> = {}
    const outBreakdown: Record<string, Record<AttributeKey, number>> = {}

    const metrics = buildMetricMatrix(vehicles, market)

    // per-attribute min/max for normalization
    const stat: Record<AttributeKey, { min: number; max: number }> = {
      range: minMax(metrics.range),
      accel: minMax(metrics.accel),
      power: minMax(metrics.power),
      features: minMax(metrics.features),
      price: minMax(metrics.price)
    }

    for (const v of vehicles) {
      const contrib: Record<AttributeKey, number> = {
        range: 0,
        accel: 0,
        power: 0,
        features: 0,
        price: 0
      }

      for (const a of ATTRIBUTES) {
        const raw = metrics[a.key][metrics.idToIndex[v.id]]
        let n = normalize01(raw, stat[a.key].min, stat[a.key].max)
        if (a.better === 'low') n = 1 - n
        contrib[a.key] = (n * weights[a.key]) / 100
      }

      outBreakdown[v.id] = contrib
      outScores[v.id] = round(Object.values(contrib).reduce((s, x) => s + x, 0) * 100, 1)
    }

    return { scores: outScores, breakdown: outBreakdown }
  }, [vehicles, weights, market])

  const deltas = React.useMemo(() => {
    if (!prev.current) return [] as { id: string; delta: number; reason: string }[]
    const prevScores = prev.current.scores
    const out = vehicles.map((v) => {
      const delta = round((scores[v.id] ?? 0) - (prevScores[v.id] ?? 0), 1)
      return { id: v.id, delta }
    })

    const moved = out.filter((d) => Math.abs(d.delta) >= 1).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3)

    return moved.map((m) => {
      const v = vehicles.find((x) => x.id === m.id)
      const reason = m.delta > 0 ? 'gained perceived value under the new weights' : 'lost perceived value under the new weights'
      return { ...m, reason: `${v?.brand ?? 'Vehicle'} ${v?.model ?? ''} ${reason}.` }
    })
  }, [vehicles, scores])

  React.useEffect(() => {
    prev.current = { weights, scores }
  }, [weights]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!vehicleIds.length) {
    return <EmptyBasket title="Strategic Pricing" description="Add at least one vehicle to explore perceived value weighting." />
  }

  if (loading) {
    return <LoadingBlock title="Strategic Pricing" />
  }

  if (error) {
    return <ErrorState title="Strategic Pricing" message={error} onRetry={refetch} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Strategic Pricing</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Value weighting</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Adjust how customers value attributes — then see how the basket ranks. We normalize attributes across
            the basket and compute a weighted score.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/product-data">Open Product Data</Link>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Explain methodology">
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px]">
              <div className="text-sm font-semibold">How the score is computed</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Each attribute is normalized across vehicles (min → max → 0…1).</li>
                <li>For “lower is better” attributes, normalization is inverted.</li>
                <li>Weights are automatically normalized to sum to 100%.</li>
                <li>The final score is the weighted sum, scaled to 0…100.</li>
              </ul>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Weights</CardTitle>
            <CardDescription>Use presets or fine-tune. The total is always 100%.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.keys(PRESETS).map((name) => (
                <Button
                  key={name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const preset = PRESETS[name]
                    const next = normalizeWeights({
                      range: preset.range ?? weights.range,
                      accel: preset.accel ?? weights.accel,
                      power: preset.power ?? weights.power,
                      features: preset.features ?? weights.features,
                      price: preset.price ?? weights.price
                    })
                    setWeights(next)
                  }}
                >
                  {name}
                </Button>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground">Total</div>
                <Badge className="mono-num" variant="accent">
                  {Math.round(Object.values(weights).reduce((a, b) => a + b, 0))}%
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {ATTRIBUTES.map((a, idx) => (
                <div key={a.key} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{a.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{a.description}</div>
                    </div>
                    <div className="mono-num text-sm font-semibold">{Math.round(weights[a.key])}%</div>
                  </div>
                  <div className="mt-3">
                    <Slider
                      value={[weights[a.key]]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([v]) => {
                        const next = normalizeWeights({ ...weights, [a.key]: v })
                        setWeights(next)
                      }}
                      aria-label={`${a.label} weight`}
                    />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {deltas.length ? (
              <div className="rounded-lg border border-border bg-accent/10 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-accent" /> What moved the needle
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {deltas.map((d) => {
                    const v = vehicles.find((x) => x.id === d.id)
                    return (
                      <div key={d.id}>
                        <span className="font-medium text-fg">{v?.brand} {v?.model}</span>: {d.delta > 0 ? '+' : ''}{d.delta} — {d.reason}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perceived Value Score</CardTitle>
            <CardDescription>Breakdown by attribute (weights) per vehicle.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vehicles.map((v) => ({
                      name: `${v.brand} ${v.model}`,
                      id: v.id,
                      ...Object.fromEntries(ATTRIBUTES.map((a) => [a.key, round((breakdown[v.id]?.[a.key] ?? 0) * 100, 1)]))
                    }))}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 10, bottom: 0 }}
                  >
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(n) => `${n}`} />
                    <YAxis type="category" dataKey="name" width={160} />
                    <RTooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 12
                      }}
                    />
                    <Legend />
                    {ATTRIBUTES.map((a, i) => (
                      <Bar
                        key={a.key}
                        dataKey={a.key}
                        stackId="a"
                        fill={`hsl(var(--chart-${((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6}))`}
                        isAnimationActive
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {vehicles
                  .slice()
                  .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
                  .map((v, i) => (
                    <div key={v.id} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{v.brand} {v.model}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{v.trim}</div>
                        </div>
                        <Badge variant={i === 0 ? 'accent' : 'default'} className="mono-num">
                          {scores[v.id] ?? 0}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        MSRP {formatCurrency(v.msrp, market)} • {v.powertrain} • {v.bodyType}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function buildMetricMatrix(vehicles: any[], market: any) {
  const idToIndex: Record<string, number> = {}
  vehicles.forEach((v, i) => (idToIndex[v.id] = i))

  const range = vehicles.map((v) => v.specs.rangeKm ?? 0)
  const accel = vehicles.map((v) => v.specs.zeroToHundred ?? 0)
  const power = vehicles.map((v) => v.specs.horsepower ?? 0)
  const features = vehicles.map((v) => (v.packages?.length ?? 0) + (v.options?.length ?? 0))
  const price = vehicles.map((v) => v.msrp ?? 0)

  return { idToIndex, range, accel, power, features, price }
}
