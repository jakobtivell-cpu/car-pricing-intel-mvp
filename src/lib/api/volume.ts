import type { Market, VolumePoint } from '@/lib/models'
import { VEHICLES, VOLUME_HISTORY } from '@/data/mock'

import { maybeThrow, simulateNetwork } from '@/lib/api/_helpers'

export type VolumeQuery = {
  vehicleIds: string[]
  market: Market
  dateRange?: { fromMonth: string; toMonth: string }
  segment?: string
  powertrain?: string
  failureRate?: number
}

export async function getVolumeHistory(query: VolumeQuery): Promise<Record<string, VolumePoint[]>> {
  await simulateNetwork([280, 760])
  maybeThrow(query.failureRate ?? 0)

  const { vehicleIds, market, dateRange } = query

  const out: Record<string, VolumePoint[]> = {}
  for (const id of vehicleIds) {
    const all = VOLUME_HISTORY[id]?.[market] ?? []
    out[id] = dateRange ? all.filter((p) => p.month >= dateRange.fromMonth && p.month <= dateRange.toMonth) : all
  }
  return out
}

export function pickCompetitors(vehicleIds: string[], limit = 3) {
  const selected = VEHICLES.filter((v) => vehicleIds.includes(v.id))
  const segments = new Set(selected.map((v) => v.segment))
  const powertrains = new Set(selected.map((v) => v.powertrain))

  const candidates = VEHICLES.filter(
    (v) => !vehicleIds.includes(v.id) && segments.has(v.segment) && powertrains.has(v.powertrain)
  )

  return candidates
    .slice(0, 24)
    .sort((a, b) => a.brand.localeCompare(b.brand))
    .slice(0, limit)
    .map((v) => v.id)
}
