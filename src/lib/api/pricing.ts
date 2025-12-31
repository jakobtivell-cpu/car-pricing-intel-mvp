import type { Market, PricePoint } from '@/lib/models'
import { PRICE_HISTORY } from '@/data/mock'

import { maybeThrow, simulateNetwork } from '@/lib/api/_helpers'

export type PriceHistoryQuery = {
  vehicleIds: string[]
  market: Market
  dateRange?: { fromMonth: string; toMonth: string } // YYYY-MM
  failureRate?: number
}

export async function getPriceHistory(query: PriceHistoryQuery): Promise<Record<string, PricePoint[]>> {
  await simulateNetwork([280, 760])
  maybeThrow(query.failureRate ?? 0)

  const { vehicleIds, market, dateRange } = query

  const out: Record<string, PricePoint[]> = {}
  for (const id of vehicleIds) {
    const all = PRICE_HISTORY[id]?.[market] ?? []
    out[id] = dateRange ? all.filter((p) => p.month >= dateRange.fromMonth && p.month <= dateRange.toMonth) : all
  }

  return out
}
