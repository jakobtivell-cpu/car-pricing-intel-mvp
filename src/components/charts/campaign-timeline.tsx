'use client'

import * as React from 'react'

import type { Campaign } from '@/lib/models'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

type VehicleLabel = { id: string; label: string }

export function CampaignTimeline({
  campaigns,
  vehicles,
  fromISO,
  toISO
}: {
  campaigns: Campaign[]
  vehicles: VehicleLabel[]
  fromISO: string
  toISO: string
}) {
  const from = React.useMemo(() => new Date(fromISO), [fromISO])
  const to = React.useMemo(() => new Date(toISO), [toISO])
  const total = Math.max(1, to.getTime() - from.getTime())

  const byVehicle = React.useMemo(() => {
    const map: Record<string, Campaign[]> = {}
    for (const c of campaigns) {
      if (!map[c.vehicleId]) map[c.vehicleId] = []
      map[c.vehicleId].push(c)
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.start < b.start ? -1 : 1))
    }
    return map
  }, [campaigns])

  return (
    <div className="space-y-3">
      {vehicles.map((v) => {
        const list = byVehicle[v.id] ?? []
        return (
          <div key={v.id} className="grid grid-cols-[220px_1fr] items-center gap-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{v.label}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {list.slice(0, 3).map((c) => (
                  <Badge key={c.id} variant="default">
                    {c.type}
                  </Badge>
                ))}
                {list.length > 3 ? (
                  <Badge variant="default">+{list.length - 3}</Badge>
                ) : null}
              </div>
            </div>
            <div className="relative h-10 overflow-hidden rounded-md border border-border bg-muted">
              {list.map((c) => {
                const left = (new Date(c.start).getTime() - from.getTime()) / total
                const right = (new Date(c.end).getTime() - from.getTime()) / total
                const l = Math.max(0, Math.min(1, left))
                const r = Math.max(0, Math.min(1, right))
                const w = Math.max(0.02, r - l)

                return (
                  <Tooltip key={c.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'absolute top-1.5 h-7 rounded-md border border-accent/20 bg-accent/20 hover:bg-accent/30 transition-colors',
                          c.type === 'Cash' ? 'bg-success/20 hover:bg-success/30 border-success/30' : '',
                          c.type === 'Lease' ? 'bg-warning/20 hover:bg-warning/30 border-warning/30' : ''
                        )}
                        style={{ left: `${l * 100}%`, width: `${w * 100}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="w-72">
                      <div className="text-sm font-semibold">{c.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {c.start} → {c.end}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md border border-border bg-card p-2">
                          <div className="text-muted-foreground">Type</div>
                          <div className="mt-0.5 font-medium">{c.type}</div>
                        </div>
                        <div className="rounded-md border border-border bg-card p-2">
                          <div className="text-muted-foreground">Discount</div>
                          <div className="mt-0.5 font-medium">{c.discountPct}%</div>
                        </div>
                        <div className="rounded-md border border-border bg-card p-2">
                          <div className="text-muted-foreground">Cash</div>
                          <div className="mt-0.5 font-medium">{c.cashIncentive}</div>
                        </div>
                        <div className="rounded-md border border-border bg-card p-2">
                          <div className="text-muted-foreground">Lease from</div>
                          <div className="mt-0.5 font-medium">{c.leaseFrom ?? '—'}</div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
