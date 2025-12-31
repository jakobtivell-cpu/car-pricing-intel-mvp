import { describe, expect, it, beforeEach } from 'vitest'

import { useBasketStore } from '@/lib/store/basket-store'

describe('basket-store', () => {
  beforeEach(() => {
    useBasketStore.setState({ vehicleIds: [], saved: [] })
  })

  it('adds unique vehicle ids', () => {
    const { add } = useBasketStore.getState()
    add('v1')
    add('v1')
    add('v2')
    expect(useBasketStore.getState().vehicleIds).toEqual(['v1', 'v2'])
  })

  it('can save and load a basket', () => {
    const s = useBasketStore.getState()
    s.add('v1')
    s.add('v2')
    const saved = s.saveCurrent('My Basket')
    s.clear()
    expect(useBasketStore.getState().vehicleIds).toEqual([])
    s.load(saved.id)
    expect(useBasketStore.getState().vehicleIds).toEqual(['v1', 'v2'])
  })
})
