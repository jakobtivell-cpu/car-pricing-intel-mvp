import type { Campaign, CampaignType, Market, PricePoint, VehicleByMarket, VolumePoint } from '@/lib/models'
import { MARKETS } from '@/lib/models'

// A small deterministic PRNG for stable mock data.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(42)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const CURRENCY: Record<Market, 'SEK' | 'EUR' | 'GBP'> = {
  Sweden: 'SEK',
  Germany: 'EUR',
  UK: 'GBP'
}

// EUR baseline -> local-ish mock conversion. (Not meant to be real-time.)
const FX: Record<Market, number> = {
  Germany: 1,
  Sweden: 11.3,
  UK: 0.86
}

const months = (() => {
  const out: string[] = []
  for (let y = 2023; y <= 2025; y++) {
    for (let m = 1; m <= 12; m++) {
      out.push(`${y}-${String(m).padStart(2, '0')}`)
    }
  }
  return out
})()

function localPrice(eur: number, market: Market) {
  return Math.round(eur * FX[market] * 1000) // keep numbers chunky for readability
}

function seriesAround(base: number, volatility = 0.08) {
  let v = base
  return months.map((month) => {
    v = v * (1 + (rand() - 0.5) * volatility)
    return { month, value: Math.round(v) }
  })
}

export const VEHICLES: VehicleByMarket[] = [
  {
    id: 'v_volvo_ex90_ultra',
    oem: 'Volvo Cars',
    brand: 'Volvo',
    model: 'EX90',
    trim: 'Ultra Twin Motor',
    year: 2025,
    powertrain: 'BEV',
    drivetrain: 'AWD',
    bodyType: 'SUV',
    segment: 'SUV-D',
    specs: {
      rangeKm: 600,
      batteryKwh: 111,
      horsepower: 496,
      torqueNm: 910,
      zeroToHundred: 4.9,
      curbWeightKg: 2818,
      lengthMm: 5037,
      widthMm: 1964,
      heightMm: 1747
    },
    packages: ['Pilot Assist+', 'Bowers & Wilkins', 'Air Suspension'],
    options: ['7-seat', 'Tow package', 'Heated steering wheel'],
    pricing: {
      Sweden: {
        msrp: localPrice(104, 'Sweden'),
        listPrice: localPrice(106, 'Sweden'),
        transactionEstimate: localPrice(101, 'Sweden'),
        incentives: localPrice(2.2, 'Sweden'),
        currency: CURRENCY.Sweden
      },
      Germany: {
        msrp: localPrice(104, 'Germany'),
        listPrice: localPrice(106, 'Germany'),
        transactionEstimate: localPrice(101, 'Germany'),
        incentives: localPrice(2.2, 'Germany'),
        currency: CURRENCY.Germany
      },
      UK: {
        msrp: localPrice(104, 'UK'),
        listPrice: localPrice(106, 'UK'),
        transactionEstimate: localPrice(101, 'UK'),
        incentives: localPrice(2.2, 'UK'),
        currency: CURRENCY.UK
      }
    }
  },
  {
    id: 'v_polestar_3_perf',
    oem: 'Polestar Automotive',
    brand: 'Polestar',
    model: '3',
    trim: 'Performance Pack',
    year: 2024,
    powertrain: 'BEV',
    drivetrain: 'AWD',
    bodyType: 'SUV',
    segment: 'SUV-D',
    specs: {
      rangeKm: 560,
      batteryKwh: 111,
      horsepower: 517,
      torqueNm: 910,
      zeroToHundred: 4.7,
      curbWeightKg: 2584,
      lengthMm: 4900,
      widthMm: 1968,
      heightMm: 1614
    },
    packages: ['Performance Pack', 'Pilot Pack', 'Plus Pack'],
    options: ['Tow bar', '21" wheels', 'Nappa interior'],
    pricing: {
      Sweden: {
        msrp: localPrice(90, 'Sweden'),
        listPrice: localPrice(92, 'Sweden'),
        transactionEstimate: localPrice(86, 'Sweden'),
        incentives: localPrice(3.1, 'Sweden'),
        currency: CURRENCY.Sweden
      },
      Germany: {
        msrp: localPrice(90, 'Germany'),
        listPrice: localPrice(92, 'Germany'),
        transactionEstimate: localPrice(86, 'Germany'),
        incentives: localPrice(3.1, 'Germany'),
        currency: CURRENCY.Germany
      },
      UK: {
        msrp: localPrice(90, 'UK'),
        listPrice: localPrice(92, 'UK'),
        transactionEstimate: localPrice(86, 'UK'),
        incentives: localPrice(3.1, 'UK'),
        currency: CURRENCY.UK
      }
    }
  },
  {
    id: 'v_tesla_model_y_lr',
    oem: 'Tesla',
    brand: 'Tesla',
    model: 'Model Y',
    trim: 'Long Range',
    year: 2025,
    powertrain: 'BEV',
    drivetrain: 'AWD',
    bodyType: 'SUV',
    segment: 'SUV-C',
    specs: {
      rangeKm: 533,
      batteryKwh: 78,
      horsepower: 384,
      torqueNm: 510,
      zeroToHundred: 5.0,
      curbWeightKg: 2003,
      lengthMm: 4751,
      widthMm: 1921,
      heightMm: 1624
    },
    packages: ['Autopilot', 'Premium Connectivity'],
    options: ['Tow hitch', '20" wheels'],
    pricing: {
      Sweden: {
        msrp: localPrice(52, 'Sweden'),
        listPrice: localPrice(52, 'Sweden'),
        transactionEstimate: localPrice(49, 'Sweden'),
        incentives: localPrice(1.4, 'Sweden'),
        currency: CURRENCY.Sweden
      },
      Germany: {
        msrp: localPrice(52, 'Germany'),
        listPrice: localPrice(52, 'Germany'),
        transactionEstimate: localPrice(49, 'Germany'),
        incentives: localPrice(1.4, 'Germany'),
        currency: CURRENCY.Germany
      },
      UK: {
        msrp: localPrice(52, 'UK'),
        listPrice: localPrice(52, 'UK'),
        transactionEstimate: localPrice(49, 'UK'),
        incentives: localPrice(1.4, 'UK'),
        currency: CURRENCY.UK
      }
    }
  },
  {
    id: 'v_bmw_i4_m50',
    oem: 'BMW Group',
    brand: 'BMW',
    model: 'i4',
    trim: 'M50',
    year: 2024,
    powertrain: 'BEV',
    drivetrain: 'AWD',
    bodyType: 'Coupe',
    segment: 'D',
    specs: {
      rangeKm: 510,
      batteryKwh: 83,
      horsepower: 536,
      torqueNm: 795,
      zeroToHundred: 3.9,
      curbWeightKg: 2215,
      lengthMm: 4783,
      widthMm: 1852,
      heightMm: 1448
    },
    packages: ['M Sport Pro', 'Driving Assistant Pro', 'Harman Kardon'],
    options: ['Adaptive suspension', 'Laserlight', 'HUD'],
    pricing: {
      Sweden: {
        msrp: localPrice(78, 'Sweden'),
        listPrice: localPrice(81, 'Sweden'),
        transactionEstimate: localPrice(75, 'Sweden'),
        incentives: localPrice(2.0, 'Sweden'),
        currency: CURRENCY.Sweden
      },
      Germany: {
        msrp: localPrice(78, 'Germany'),
        listPrice: localPrice(81, 'Germany'),
        transactionEstimate: localPrice(75, 'Germany'),
        incentives: localPrice(2.0, 'Germany'),
        currency: CURRENCY.Germany
      },
      UK: {
        msrp: localPrice(78, 'UK'),
        listPrice: localPrice(81, 'UK'),
        transactionEstimate: localPrice(75, 'UK'),
        incentives: localPrice(2.0, 'UK'),
        currency: CURRENCY.UK
      }
    }
  },
  {
    id: 'v_vw_id4_pro',
    oem: 'Volkswagen Group',
    brand: 'Volkswagen',
    model: 'ID.4',
    trim: 'Pro',
    year: 2024,
    powertrain: 'BEV',
    drivetrain: 'RWD',
    bodyType: 'SUV',
    segment: 'SUV-C',
    specs: {
      rangeKm: 520,
      batteryKwh: 77,
      horsepower: 204,
      torqueNm: 310,
      zeroToHundred: 8.5,
      curbWeightKg: 2124,
      lengthMm: 4584,
      widthMm: 1852,
      heightMm: 1636
    },
    packages: ['IQ.Drive', 'Comfort pack'],
    options: ['Heat pump', 'Tow package'],
    pricing: {
      Sweden: {
        msrp: localPrice(48, 'Sweden'),
        listPrice: localPrice(49, 'Sweden'),
        transactionEstimate: localPrice(45, 'Sweden'),
        incentives: localPrice(1.8, 'Sweden'),
        currency: CURRENCY.Sweden
      },
      Germany: {
        msrp: localPrice(48, 'Germany'),
        listPrice: localPrice(49, 'Germany'),
        transactionEstimate: localPrice(45, 'Germany'),
        incentives: localPrice(1.8, 'Germany'),
        currency: CURRENCY.Germany
      },
      UK: {
        msrp: localPrice(48, 'UK'),
        listPrice: localPrice(49, 'UK'),
        transactionEstimate: localPrice(45, 'UK'),
        incentives: localPrice(1.8, 'UK'),
        currency: CURRENCY.UK
      }
    }
  },
  {
    id: 'v_mercedes_glc_300e',
    oem: 'Mercedes-Benz Group',
    brand: 'Mercedes-Benz',
    model: 'GLC',
    trim: '300e 4MATIC',
    year: 2024,
    powertrain: 'PHEV',
    drivetrain: 'AWD',
    bodyType: 'SUV',
    segment: 'SUV-C',
    specs: {
      rangeKm: 120,
      batteryKwh: 31,
      horsepower: 313,
      torqueNm: 550,
      zeroToHundred: 6.7,
      curbWeightKg: 2310,
      lengthMm: 4716,
      widthMm: 1890,
      heightMm: 1640
    },
    packages: ['AMG Line', 'Premium', 'Driver Assistance'],
    options: ['Air Body Control', 'Panoramic roof'],
    pricing: {
      Sweden: {
        msrp: localPrice(72, 'Sweden'),
        listPrice: localPrice(74, 'Sweden'),
        transactionEstimate: localPrice(69, 'Sweden'),
        incentives: localPrice(1.2, 'Sweden'),
        currency: CURRENCY.Sweden
      },
      Germany: {
        msrp: localPrice(72, 'Germany'),
        listPrice: localPrice(74, 'Germany'),
        transactionEstimate: localPrice(69, 'Germany'),
        incentives: localPrice(1.2, 'Germany'),
        currency: CURRENCY.Germany
      },
      UK: {
        msrp: localPrice(72, 'UK'),
        listPrice: localPrice(74, 'UK'),
        transactionEstimate: localPrice(69, 'UK'),
        incentives: localPrice(1.2, 'UK'),
        currency: CURRENCY.UK
      }
    }
  }
]

// Add a few more competitors via generation to make the app feel alive.
const extraDefs: Array<Pick<VehicleByMarket, 'id' | 'oem' | 'brand' | 'model' | 'trim' | 'year' | 'powertrain' | 'drivetrain' | 'bodyType' | 'segment' | 'specs' | 'packages' | 'options'>> = [
  {
    id: 'v_kia_ev6_gtl',
    oem: 'Kia',
    brand: 'Kia',
    model: 'EV6',
    trim: 'GT-Line',
    year: 2024,
    powertrain: 'BEV',
    drivetrain: 'AWD',
    bodyType: 'Hatchback',
    segment: 'C',
    specs: {
      rangeKm: 528,
      batteryKwh: 77,
      horsepower: 325,
      torqueNm: 605,
      zeroToHundred: 5.2,
      curbWeightKg: 2055,
      lengthMm: 4695,
      widthMm: 1890,
      heightMm: 1550
    },
    packages: ['GT-Line', 'Tech pack'],
    options: ['Heat pump', '360 camera']
  },
  {
    id: 'v_hyundai_ioniq5_awd',
    oem: 'Hyundai',
    brand: 'Hyundai',
    model: 'IONIQ 5',
    trim: 'AWD Ultimate',
    year: 2025,
    powertrain: 'BEV',
    drivetrain: 'AWD',
    bodyType: 'Hatchback',
    segment: 'C',
    specs: {
      rangeKm: 507,
      batteryKwh: 77,
      horsepower: 305,
      torqueNm: 605,
      zeroToHundred: 5.2,
      curbWeightKg: 2065,
      lengthMm: 4635,
      widthMm: 1890,
      heightMm: 1605
    },
    packages: ['Ultimate', 'SmartSense'],
    options: ['V2L adapter', 'Digital mirrors']
  },
  {
    id: 'v_audi_q4_50',
    oem: 'Volkswagen Group',
    brand: 'Audi',
    model: 'Q4 e-tron',
    trim: '50 quattro',
    year: 2024,
    powertrain: 'BEV',
    drivetrain: 'AWD',
    bodyType: 'SUV',
    segment: 'SUV-C',
    specs: {
      rangeKm: 488,
      batteryKwh: 77,
      horsepower: 299,
      torqueNm: 460,
      zeroToHundred: 6.2,
      curbWeightKg: 2150,
      lengthMm: 4588,
      widthMm: 1865,
      heightMm: 1632
    },
    packages: ['S line', 'Virtual cockpit'],
    options: ['Sonos audio', 'Matrix LED']
  },
  {
    id: 'v_ford_kuga_hev',
    oem: 'Ford',
    brand: 'Ford',
    model: 'Kuga',
    trim: 'HEV Titanium',
    year: 2024,
    powertrain: 'HEV',
    drivetrain: 'FWD',
    bodyType: 'SUV',
    segment: 'SUV-C',
    specs: {
      rangeKm: null,
      batteryKwh: null,
      horsepower: 190,
      torqueNm: 210,
      zeroToHundred: 9.1,
      curbWeightKg: 1650,
      lengthMm: 4614,
      widthMm: 1882,
      heightMm: 1680
    },
    packages: ['Driver Assist'],
    options: ['Panoramic roof', 'Winter pack']
  },
  {
    id: 'v_toyota_rav4_phev',
    oem: 'Toyota',
    brand: 'Toyota',
    model: 'RAV4',
    trim: 'PHEV AWD-i',
    year: 2024,
    powertrain: 'PHEV',
    drivetrain: 'AWD',
    bodyType: 'SUV',
    segment: 'SUV-C',
    specs: {
      rangeKm: 75,
      batteryKwh: 18.1,
      horsepower: 306,
      torqueNm: 0,
      zeroToHundred: 6.0,
      curbWeightKg: 1910,
      lengthMm: 4600,
      widthMm: 1855,
      heightMm: 1685
    },
    packages: ['Safety Sense', 'Premium'],
    options: ['Tow bar', 'Heated rear seats']
  },
  {
    id: 'v_skoda_octavia_combi',
    oem: 'Volkswagen Group',
    brand: 'Škoda',
    model: 'Octavia',
    trim: 'Combi Style',
    year: 2024,
    powertrain: 'ICE',
    drivetrain: 'FWD',
    bodyType: 'Wagon',
    segment: 'C',
    specs: {
      rangeKm: null,
      batteryKwh: null,
      horsepower: 150,
      torqueNm: 250,
      zeroToHundred: 8.3,
      curbWeightKg: 1430,
      lengthMm: 4698,
      widthMm: 1829,
      heightMm: 1468
    },
    packages: ['Travel Assist'],
    options: ['Adaptive cruise', 'Matrix LED']
  },
  {
    id: 'v_volvo_xc60_t6',
    oem: 'Volvo Cars',
    brand: 'Volvo',
    model: 'XC60',
    trim: 'T6 Recharge',
    year: 2024,
    powertrain: 'PHEV',
    drivetrain: 'AWD',
    bodyType: 'SUV',
    segment: 'SUV-C',
    specs: {
      rangeKm: 82,
      batteryKwh: 18.8,
      horsepower: 455,
      torqueNm: 709,
      zeroToHundred: 4.9,
      curbWeightKg: 2150,
      lengthMm: 4708,
      widthMm: 1902,
      heightMm: 1658
    },
    packages: ['Pilot Assist', 'Harman Kardon'],
    options: ['Air purifier', 'Panoramic roof']
  },
  {
    id: 'v_bmw_x3_30e',
    oem: 'BMW Group',
    brand: 'BMW',
    model: 'X3',
    trim: '30e xDrive',
    year: 2024,
    powertrain: 'PHEV',
    drivetrain: 'AWD',
    bodyType: 'SUV',
    segment: 'SUV-C',
    specs: {
      rangeKm: 81,
      batteryKwh: 19.7,
      horsepower: 292,
      torqueNm: 420,
      zeroToHundred: 6.1,
      curbWeightKg: 2055,
      lengthMm: 4708,
      widthMm: 1891,
      heightMm: 1676
    },
    packages: ['M Sport', 'Driving Assistant'],
    options: ['HUD', 'Panoramic roof']
  },
  {
    id: 'v_nissan_ariya_e4orce',
    oem: 'Nissan',
    brand: 'Nissan',
    model: 'Ariya',
    trim: 'e-4ORCE',
    year: 2024,
    powertrain: 'BEV',
    drivetrain: 'AWD',
    bodyType: 'SUV',
    segment: 'SUV-C',
    specs: {
      rangeKm: 505,
      batteryKwh: 87,
      horsepower: 306,
      torqueNm: 600,
      zeroToHundred: 5.7,
      curbWeightKg: 2200,
      lengthMm: 4595,
      widthMm: 1850,
      heightMm: 1660
    },
    packages: ['ProPILOT', 'Tech'],
    options: ['Panoramic roof', 'Bose audio']
  },
  {
    id: 'v_peugeot_308_hybrid',
    oem: 'Stellantis',
    brand: 'Peugeot',
    model: '308',
    trim: 'Hybrid 225',
    year: 2024,
    powertrain: 'PHEV',
    drivetrain: 'FWD',
    bodyType: 'Hatchback',
    segment: 'C',
    specs: {
      rangeKm: 60,
      batteryKwh: 12.4,
      horsepower: 225,
      torqueNm: 360,
      zeroToHundred: 7.6,
      curbWeightKg: 1600,
      lengthMm: 4367,
      widthMm: 1852,
      heightMm: 1441
    },
    packages: ['GT Pack'],
    options: ['Night vision', '360 camera']
  }
]

for (const d of extraDefs) {
  // Price baseline from a rough heuristic.
  const baseEur =
    d.powertrain === 'BEV' ? 55 : d.powertrain === 'PHEV' ? 50 : d.powertrain === 'HEV' ? 40 : 32
  const msrpEur = baseEur + (rand() - 0.5) * 18
  const listEur = msrpEur + rand() * 2
  const txnEur = msrpEur * (0.92 + rand() * 0.06)
  const incentEur = clamp(msrpEur * (0.01 + rand() * 0.05), 0.6, 5.0)

  VEHICLES.push({
    ...d,
    pricing: Object.fromEntries(
      MARKETS.map((m) => [
        m,
        {
          msrp: localPrice(msrpEur, m),
          listPrice: localPrice(listEur, m),
          transactionEstimate: localPrice(txnEur, m),
          incentives: localPrice(incentEur, m),
          currency: CURRENCY[m]
        }
      ])
    ) as VehicleByMarket['pricing']
  })
}

export const PRICE_HISTORY: Record<string, Record<Market, PricePoint[]>> = {}
export const VOLUME_HISTORY: Record<string, Record<Market, VolumePoint[]>> = {}
export const CAMPAIGNS: Record<string, Campaign[]> = {}

for (const v of VEHICLES) {
  PRICE_HISTORY[v.id] = {} as any
  VOLUME_HISTORY[v.id] = {} as any
  CAMPAIGNS[v.id] = []

  for (const m of MARKETS) {
    const p = v.pricing[m]
    const msrp = seriesAround(p.msrp, 0.02)
    const txn = seriesAround(p.transactionEstimate, 0.06)
    const incent = seriesAround(p.incentives, 0.25)

    PRICE_HISTORY[v.id][m] = months.map((month, i) => ({
      month,
      msrp: msrp[i].value,
      transaction: txn[i].value,
      incentive: incent[i].value
    }))

    // Volume baseline: smaller for luxury/EV, larger for mainstream.
    const base =
      v.brand === 'Tesla'
        ? 2200
        : v.powertrain === 'BEV'
          ? 900
          : v.powertrain === 'PHEV'
            ? 1200
            : 1600

    let segBase = v.segment.includes('SUV') ? 0.14 : 0.09
    if (v.segment === 'Luxury') segBase = 0.06

    const vol = seriesAround(base + rand() * 600, 0.18)
    VOLUME_HISTORY[v.id][m] = months.map((month, i) => ({
      month,
      registrations: clamp(vol[i].value, 50, 5200),
      segmentShare: clamp(segBase + (rand() - 0.5) * 0.03, 0.02, 0.26)
    }))
  }

  // Campaigns per vehicle per market.
  for (const m of MARKETS) {
    const count = 4 + Math.floor(rand() * 3)
    for (let i = 0; i < count; i++) {
      const year = pick([2024, 2025])
      const startMonth = 1 + Math.floor(rand() * 10)
      const duration = 20 + Math.floor(rand() * 70)
      const start = new Date(Date.UTC(year, startMonth - 1, 1 + Math.floor(rand() * 20)))
      const end = new Date(start)
      end.setUTCDate(end.getUTCDate() + duration)

      const type: CampaignType = pick(['Cash', 'Lease', 'APR', 'Bundle', 'Fleet'])
      const discountPct = clamp(2 + rand() * 10, 1, 18)
      const cashIncentive = Math.round(localPrice(0.8 + rand() * 3.5, m))

      const title =
        type === 'Lease'
          ? 'Lease from'
          : type === 'APR'
            ? 'Low APR'
            : type === 'Bundle'
              ? 'Tech bundle'
              : type === 'Fleet'
                ? 'Fleet program'
                : 'Cash incentive'

      const campaign: Campaign = {
        id: `${v.id}_${m}_${i}`,
        vehicleId: v.id,
        market: m,
        type,
        title,
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
        discountPct: Math.round(discountPct),
        cashIncentive,
        leaseFrom: type === 'Lease' ? Math.round(localPrice(0.5 + rand() * 0.7, m) / 12) : undefined,
        aprFrom: type === 'APR' ? Math.round((1.1 + rand() * 3.2) * 10) / 10 : undefined
      }

      CAMPAIGNS[v.id].push(campaign)
    }
  }
}

export function getAllBrands() {
  return Array.from(new Set(VEHICLES.map((v) => v.brand))).sort()
}

export function getAllSegments() {
  return Array.from(new Set(VEHICLES.map((v) => v.segment))).sort()
}

export function getAllBodyTypes() {
  return Array.from(new Set(VEHICLES.map((v) => v.bodyType))).sort()
}

export function todayISO() {
  // Static date to keep the MVP stable in screenshots; replace with new Date() in production.
  return '2025-12-31'
}
