export const MARKETS = ['Sweden', 'Germany', 'UK'] as const
export type Market = (typeof MARKETS)[number]

export const POWERTRAINS = ['ICE', 'HEV', 'PHEV', 'BEV'] as const
export type Powertrain = (typeof POWERTRAINS)[number]

export const DRIVETRAINS = ['FWD', 'RWD', 'AWD'] as const
export type Drivetrain = (typeof DRIVETRAINS)[number]

export const BODY_TYPES = ['Sedan', 'Hatchback', 'SUV', 'Wagon', 'Coupe', 'Van'] as const
export type BodyType = (typeof BODY_TYPES)[number]

export const SEGMENTS = ['A', 'B', 'C', 'D', 'E', 'SUV-C', 'SUV-D', 'Luxury', 'Pickup'] as const
export type Segment = (typeof SEGMENTS)[number]

export type KeySpecs = {
  rangeKm: number | null
  batteryKwh: number | null
  horsepower: number
  torqueNm: number
  zeroToHundred: number
  curbWeightKg: number
  lengthMm: number
  widthMm: number
  heightMm: number
}

export type Vehicle = {
  id: string
  oem: string
  brand: string
  model: string
  trim: string
  year: number
  powertrain: Powertrain
  drivetrain: Drivetrain
  bodyType: BodyType
  segment: Segment
  specs: KeySpecs
  packages: string[]
  options: string[]
}

export type VehiclePricing = {
  msrp: number
  listPrice: number
  transactionEstimate: number
  incentives: number
  currency: 'SEK' | 'EUR' | 'GBP'
}

export type VehicleByMarket = Vehicle & {
  pricing: Record<Market, VehiclePricing>
}

export type CampaignType = 'Cash' | 'Lease' | 'APR' | 'Bundle' | 'Fleet'

export type Campaign = {
  id: string
  vehicleId: string
  market: Market
  type: CampaignType
  title: string
  start: string // ISO date
  end: string // ISO date
  discountPct: number
  cashIncentive: number
  leaseFrom?: number
  aprFrom?: number
}

export type PricePoint = {
  month: string // YYYY-MM
  msrp: number
  transaction: number
  incentive: number
}

export type VolumePoint = {
  month: string // YYYY-MM
  registrations: number
  segmentShare: number // 0-1
}

export type SortKey = 'msrp' | 'range' | 'newest' | 'volume'

export type VehicleQuery = {
  market: Market
  filters: {
    brands?: string[]
    bodyTypes?: BodyType[]
    powertrains?: Powertrain[]
    drivetrains?: Drivetrain[]
    segments?: Segment[]
    price?: [number, number]
    search?: string
  }
  sort?: SortKey
}
