export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function minMax(values: number[]) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  return { min, max }
}

export function normalize01(value: number, min: number, max: number) {
  if (!isFinite(value)) return 0
  if (max === min) return 0.5
  return (value - min) / (max - min)
}

export function round(n: number, digits = 1) {
  const p = Math.pow(10, digits)
  return Math.round(n * p) / p
}
