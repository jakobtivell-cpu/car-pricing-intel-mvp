import type { Market } from '@/lib/models'

const currencyByMarket: Record<Market, string> = {
  Sweden: 'SEK',
  Germany: 'EUR',
  UK: 'GBP'
}

export function formatCurrency(value: number, market: Market) {
  const currency = currencyByMarket[market]
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function formatPct(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`
}
