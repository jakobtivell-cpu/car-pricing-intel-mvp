export async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

export async function simulateNetwork(latency: [number, number] = [260, 720]) {
  const [min, max] = latency
  const ms = Math.round(min + Math.random() * (max - min))
  await sleep(ms)
}

export function maybeThrow(odds = 0) {
  if (odds <= 0) return
  if (Math.random() < odds) {
    throw new Error('Network hiccup (mock). Please retry.')
  }
}
