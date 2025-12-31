import type { Market, VehicleByMarket, VehicleQuery } from '@/lib/models'
import { VEHICLES, VOLUME_HISTORY } from '@/data/mock'

import { maybeThrow, simulateNetwork } from '@/lib/api/_helpers'

export type VehicleListItem = {
  id: string
  brand: string
  model: string
  trim: string
  year: number
  powertrain: VehicleByMarket['powertrain']
  drivetrain: VehicleByMarket['drivetrain']
  bodyType: VehicleByMarket['bodyType']
  segment: VehicleByMarket['segment']
  specs: VehicleByMarket['specs']
  pricing: VehicleByMarket['pricing'][Market]
  packages: VehicleByMarket['packages']
  highlights: {
    volumeL12M: number
    efficiencyIndex: number
  }
}

function last12mVolume(vehicleId: string, market: Market) {
  const series = VOLUME_HISTORY[vehicleId]?.[market] ?? []
  const last = series.slice(-12)
  const sum = last.reduce((a, p) => a + p.registrations, 0)
  return Math.round(sum)
}

export async function listVehicles(query: VehicleQuery, opts?: { errorOdds?: number }) {
  await simulateNetwork()
  maybeThrow(opts?.errorOdds ?? 0)

  const { market, filters, sort = 'msrp' } = query

  let items = VEHICLES

  if (filters.brands?.length) {
    const set = new Set(filters.brands)
    items = items.filter((v) => set.has(v.brand))
  }
  if (filters.bodyTypes?.length) {
    const set = new Set(filters.bodyTypes)
    items = items.filter((v) => set.has(v.bodyType))
  }
  if (filters.powertrains?.length) {
    const set = new Set(filters.powertrains)
    items = items.filter((v) => set.has(v.powertrain))
  }
  if (filters.drivetrains?.length) {
    const set = new Set(filters.drivetrains)
    items = items.filter((v) => set.has(v.drivetrain))
  }
  if (filters.segments?.length) {
    const set = new Set(filters.segments)
    items = items.filter((v) => set.has(v.segment))
  }
  if (filters.price) {
    const [min, max] = filters.price
    items = items.filter((v) => {
      const msrp = v.pricing[market].msrp
      return msrp >= min && msrp <= max
    })
  }

  const s = (filters.search ?? '').trim().toLowerCase()
  if (s) {
    items = items.filter((v) => {
      const hay = `${v.brand} ${v.model} ${v.trim} ${v.year}`.toLowerCase()
      return hay.includes(s)
    })
  }

  const mapped: VehicleListItem[] = items.map((v) => {
    const msrp = v.pricing[market].msrp
    const range = v.specs.rangeKm ?? 0
    const efficiencyIndex = range > 0 ? Math.round((range / Math.max(msrp, 1)) * 1_000_000) : 0
    return {
      id: v.id,
      brand: v.brand,
      model: v.model,
      trim: v.trim,
      year: v.year,
      powertrain: v.powertrain,
      drivetrain: v.drivetrain,
      bodyType: v.bodyType,
      segment: v.segment,
      specs: v.specs,
      pricing: v.pricing[market],
      packages: v.packages,
      highlights: {
        volumeL12M: last12mVolume(v.id, market),
        efficiencyIndex
      }
    }
  })

  const sorted = [...mapped]
  sorted.sort((a, b) => {
    if (sort === 'msrp') return a.pricing.msrp - b.pricing.msrp
    if (sort === 'newest') return b.year - a.year
    if (sort === 'range') return (b.specs.rangeKm ?? -1) - (a.specs.rangeKm ?? -1)
    if (sort === 'volume') return b.highlights.volumeL12M - a.highlights.volumeL12M
    return 0
  })

  return sorted
}

export async function getVehicleById(id: string) {
  await simulateNetwork([160, 420])
  const found = VEHICLES.find((v) => v.id === id)
  if (!found) throw new Error('Vehicle not found')
  return found
}

export async function searchSuggestions(term: string, market: Market) {
  await simulateNetwork([90, 220])
  const q = term.trim().toLowerCase()
  if (!q) return []

  const candidates = VEHICLES.filter((v) =>
    `${v.brand} ${v.model} ${v.trim}`.toLowerCase().includes(q)
  )
    .slice(0, 8)
    .map((v) => ({
      id: v.id,
      label: `${v.brand} ${v.model} — ${v.trim}`,
      msrp: v.pricing[market].msrp
    }))

  return candidates
}

export async function getVehiclesByIds(ids: string[], market: Market, failureRate = 0) {
  await simulateNetwork([150, 420])
  maybeThrow(failureRate)

  const found = ids
    .map((id) => VEHICLES.find((v) => v.id === id))
    .filter(Boolean) as VehicleByMarket[]

  return found
}
