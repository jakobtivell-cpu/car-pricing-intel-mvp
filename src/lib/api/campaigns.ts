import type { Campaign, CampaignType, Market } from '@/lib/models'
import { CAMPAIGNS, todayISO } from '@/data/mock'

import { maybeThrow, simulateNetwork } from '@/lib/api/_helpers'

export type CampaignQuery = {
  vehicleIds: string[]
  market: Market
  types?: CampaignType[]
  dateRange?: { from: string; to: string }
  /** Optional: force an error sometimes so UI error states can be exercised */
  failureRate?: number
}

export async function getCampaigns(query: CampaignQuery): Promise<Campaign[]> {
  await simulateNetwork([250, 700])
  maybeThrow(query.failureRate ?? 0)

  const { vehicleIds, market, types, dateRange } = query

  let campaigns = vehicleIds.flatMap((id) => CAMPAIGNS[id] ?? []).filter((c) => c.market === market)

  if (types?.length) {
    const set = new Set(types)
    campaigns = campaigns.filter((c) => set.has(c.type))
  }

  if (dateRange) {
    campaigns = campaigns.filter((c) => intersects(c, dateRange.from, dateRange.to))
  }

  campaigns.sort((a, b) => (a.start < b.start ? -1 : 1))
  return campaigns
}

function intersects(c: Campaign, fromISO: string, toISO: string) {
  return !(c.end < fromISO || c.start > toISO)
}

export function getActiveDeals(campaigns: Campaign[], asOfISO: string = todayISO()) {
  return campaigns.filter((c) => c.start <= asOfISO && c.end >= asOfISO)
}

/**
 * Simple heuristic: a mix of discount + cash intensity over the last 90 days.
 * The goal isn't truth; it's a stable signal for comparing promo intensity.
 */
export function promoIntensityIndex(
  campaigns: Campaign[],
  asOfISO: string = todayISO(),
  lookbackDays = 90
) {
  const asOf = new Date(asOfISO)
  const from = new Date(asOf)
  from.setDate(from.getDate() - lookbackDays)

  const fromISO = from.toISOString().slice(0, 10)

  const relevant = campaigns.filter((c) => intersects(c, fromISO, asOfISO))

  const score = relevant.reduce((sum, c) => {
    const cashScore = Math.min(6, c.cashIncentive / 5000)
    const pctScore = Math.min(6, c.discountPct / 4)
    const typeBonus: Record<CampaignType, number> = {
      Cash: 0.6,
      Lease: 0.9,
      APR: 0.8,
      Bundle: 0.7,
      Fleet: 0.5
    }
    return sum + cashScore + pctScore + typeBonus[c.type]
  }, 0)

  return Math.round(score * 10) / 10
}
