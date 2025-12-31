import { create } from 'zustand'

import type { BodyType, Drivetrain, Powertrain, Segment, SortKey } from '@/lib/models'

export type VehicleFilters = {
  brands: string[]
  bodyTypes: BodyType[]
  powertrains: Powertrain[]
  drivetrains: Drivetrain[]
  segments: Segment[]
  price: [number, number]
  search: string
  sort: SortKey
}

type FiltersState = {
  filters: VehicleFilters
  set: <K extends keyof VehicleFilters>(key: K, value: VehicleFilters[K]) => void
  reset: () => void
}

export const defaultFilters: VehicleFilters = {
  brands: [],
  bodyTypes: [],
  powertrains: [],
  drivetrains: [],
  segments: [],
  price: [250000, 900000],
  search: '',
  sort: 'msrp'
}

export const useFiltersStore = create<FiltersState>()((set) => ({
  filters: defaultFilters,
  set: (key, value) => set((s) => ({ ...s, filters: { ...s.filters, [key]: value } })),
  reset: () => set({ filters: defaultFilters })
}))
