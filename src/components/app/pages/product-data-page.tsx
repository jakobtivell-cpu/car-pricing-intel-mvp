'use client'

import * as React from 'react'

import { useBasketStore } from '@/lib/store/basket-store'
import { useMarketStore } from '@/lib/store/market-store'
import { useAsync } from '@/lib/utils/use-async'
import { getVehiclesByIds } from '@/lib/api/vehicles'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import type { Market, VehicleByMarket } from '@/lib/models'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { downloadText } from '@/lib/utils/download'
import { Sparkline } from '@/components/charts/sparkline'
import { Eye, Download, Columns2, ChevronUp, ChevronDown, Pin } from 'lucide-react'

import {
  ColumnDef,
  ColumnOrderState,
  ColumnPinningState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'

type Row =
  | { type: 'section'; label: string }
  | {
      type: 'metric'
      section: string
      label: string
      key: string
      unit?: string
      direction?: 'high' | 'low'
      values: Record<string, number | string | string[] | null>
      spark?: boolean
    }

export function ProductDataPage() {
  const market = useMarketStore((s) => s.market)
  const vehicleIds = useBasketStore((s) => s.vehicleIds)

  const { data, loading, error, refetch } = useAsync(() => getVehiclesByIds(vehicleIds, market), [vehicleIds.join('|'), market])
  const vehicles = data ?? []

  const [mode, setMode] = React.useState<'specs' | 'features'>('specs')

  const rows = React.useMemo(() => {
    return mode === 'specs' ? buildSpecRows(vehicles, market) : buildFeatureRows(vehicles)
  }, [vehicles, market, mode])

  const vehicleColumns = React.useMemo(() => {
    return vehicles.map((v) => ({
      id: v.id,
      header: `${v.brand} ${v.model}`,
      sub: v.trim
    }))
  }, [vehicles])

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({ left: ['attr'], right: [] })

  React.useEffect(() => {
    setColumnOrder(['attr', ...vehicleColumns.map((c) => c.id)])
  }, [vehicleColumns])

  const columns = React.useMemo<ColumnDef<Row>[]>(() => {
    const base: ColumnDef<Row>[] = [
      {
        id: 'attr',
        header: () => (
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-muted-foreground">Attribute</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>Best-in-basket highlights use subtle accent semantics.</TooltipContent>
            </Tooltip>
          </div>
        ),
        cell: ({ row }) => {
          const r = row.original
          if (r.type === 'section') {
            return <div className="py-2 text-xs font-semibold text-muted-foreground">{r.label}</div>
          }

          const numeric = Object.values(r.values).filter((v) => typeof v === 'number') as number[]
          const spark = r.spark && numeric.length > 1
          return (
            <div className="flex items-center justify-between gap-3 py-1">
              <div>
                <div className="text-sm font-medium">{r.label}</div>
                {r.unit ? <div className="text-xs text-muted-foreground">{r.unit}</div> : null}
              </div>
              {spark ? <Sparkline values={numeric} /> : null}
            </div>
          )
        },
        enablePinning: true
      }
    ]

    for (const v of vehicles) {
      base.push({
        id: v.id,
        header: () => (
          <div className="min-w-[220px]">
            <div className="text-sm font-semibold">{v.brand} {v.model}</div>
            <div className="text-xs text-muted-foreground">{v.trim}</div>
          </div>
        ),
        cell: ({ row }) => {
          const r = row.original
          if (r.type === 'section') return null
          const raw = r.values[v.id]
          const isBest = r.type === 'metric' ? bestInBasket(r, v.id) : false

          if (Array.isArray(raw)) {
            return (
              <div className={cellClass(isBest)}>
                <div className="flex flex-wrap gap-1.5">
                  {raw.slice(0, 6).map((t) => (
                    <Badge key={t} variant={isBest ? 'accent' : 'default'}>
                      {t}
                    </Badge>
                  ))}
                  {raw.length > 6 ? <Badge variant="default">+{raw.length - 6}</Badge> : null}
                </div>
              </div>
            )
          }

          if (typeof raw === 'number') {
            return <div className={cellClass(isBest)}><div className="mono-num">{formatNumber(raw)}</div></div>
          }

          if (typeof raw === 'string') {
            return <div className={cellClass(isBest)}><div className="text-sm">{raw}</div></div>
          }

          return <div className={cellClass(false)}><div className="text-sm text-muted-foreground">—</div></div>
        }
      })
    }

    return base
  }, [vehicles, rows])

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnVisibility, columnOrder, columnPinning },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    enableColumnPinning: true
  })

  const exportCsv = () => {
    const cols = table.getVisibleLeafColumns().filter((c) => c.id !== 'attr')
    const header = ['Attribute', ...cols.map((c) => c.id)]

    const lines = [header.join(',')]
    for (const r of rows) {
      if (r.type === 'section') continue
      const values = cols.map((c) => {
        const v = r.values[c.id]
        if (Array.isArray(v)) return `"${v.join('; ')}"`
        if (typeof v === 'number') return String(v)
        return v ? `"${String(v).replaceAll('"', '""')}"` : ''
      })
      lines.push([`"${r.label}"`, ...values].join(','))
    }

    downloadText(`product-data-${mode}-${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'), 'text/csv')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Product Data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare deep specs and feature packages across your basket. Sticky first column + horizontal scroll.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList>
              <TabsTrigger value="specs">Specs view</TabsTrigger>
              <TabsTrigger value="features">Feature view</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns2 className="mr-2 h-4 w-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show / hide</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {vehicleColumns.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={table.getColumn(c.id)?.getIsVisible()}
                  onCheckedChange={(v) => table.getColumn(c.id)?.toggleVisibility(!!v)}
                >
                  {c.header}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItemRow
                label="Pin first vehicle"
                icon={<Pin className="h-4 w-4" />}
                onClick={() => {
                  const first = vehicleColumns[0]?.id
                  if (!first) return
                  setColumnPinning({ left: ['attr', first], right: [] })
                }}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          <ColumnOrderDialog
            vehicleColumns={vehicleColumns}
            columnOrder={columnOrder}
            setColumnOrder={setColumnOrder}
          />

          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {vehicleIds.length < 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Add vehicles to your basket</CardTitle>
            <CardDescription>Head to the Model Picker and select 2+ models for a proper comparison.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/">Go to Model Picker</a>
            </Button>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Couldn’t load product data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refetch}>Retry</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Comparison</CardTitle>
                <CardDescription>
                  {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} • best values are subtly emphasized
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicles.map((v) => (
                  <Badge key={v.id} variant="default">
                    {v.powertrain}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id}>
                        {hg.headers.map((header) => {
                          const pinned = header.column.getIsPinned()
                          const sticky = pinned ? 'sticky left-0 z-20 bg-card' : ''
                          const stickyAttr = header.column.id === 'attr' ? 'sticky left-0 z-30 bg-card' : ''

                          return (
                            <th
                              key={header.id}
                              className={`border-b border-border p-3 text-left align-bottom ${stickyAttr || sticky}`}
                            >
                              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          )
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => {
                          const sticky = cell.column.id === 'attr' ? 'sticky left-0 z-10 bg-card' : ''
                          return (
                            <td key={cell.id} className={`border-b border-border px-3 py-2 align-top ${sticky}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Separator className="my-4" />
            <div className="text-xs text-muted-foreground">
              Highlights: <span className="font-medium text-fg">best</span> values get a subtle accent backdrop. In Colorful theme, charts and highlights pop more — surfaces stay calm.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DropdownMenuItemRow({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-fg hover:bg-muted focus-ring"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}

function ColumnOrderDialog({
  vehicleColumns,
  columnOrder,
  setColumnOrder
}: {
  vehicleColumns: { id: string; header: string; sub: string }[]
  columnOrder: string[]
  setColumnOrder: (v: ColumnOrderState) => void
}) {
  const ordered = vehicleColumns
    .map((c) => c.id)
    .sort((a, b) => columnOrder.indexOf(a) - columnOrder.indexOf(b))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <ChevronUp className="mr-2 h-4 w-4" /> Reorder
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Column order</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-1">
          {ordered.map((id, idx) => {
            const col = vehicleColumns.find((c) => c.id === id)
            if (!col) return null
            return (
              <div key={id} className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-muted">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{col.header}</div>
                  <div className="truncate text-xs text-muted-foreground">{col.sub}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Move up"
                    disabled={idx === 0}
                    onClick={() => {
                      const next = [...ordered]
                      const t = next[idx - 1]
                      next[idx - 1] = next[idx]
                      next[idx] = t
                      setColumnOrder(['attr', ...next])
                    }}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Move down"
                    disabled={idx === ordered.length - 1}
                    onClick={() => {
                      const next = [...ordered]
                      const t = next[idx + 1]
                      next[idx + 1] = next[idx]
                      next[idx] = t
                      setColumnOrder(['attr', ...next])
                    }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function cellClass(best: boolean) {
  return best ? 'rounded-md bg-accent/12 p-2' : 'p-2'
}

function buildSpecRows(vehicles: VehicleByMarket[], market: Market): Row[] {
  const metrics: Array<Omit<Extract<Row, { type: 'metric' }>, 'values'> & { get: (v: VehicleByMarket) => number | string | null }>= [
    { type: 'metric', section: 'Pricing', label: 'MSRP', key: 'msrp', unit: 'Local currency', direction: 'low', get: (v) => v.pricing[market].msrp, spark: true },
    {
      type: 'metric',
      section: 'Pricing',
      label: 'Transaction estimate',
      key: 'txn',
      unit: 'After typical discounts',
      direction: 'low',
      get: (v) => v.pricing[market].transactionEstimate
    },
    {
      type: 'metric',
      section: 'Battery & Range',
      label: 'WLTP Range',
      key: 'rangeKm',
      unit: 'km',
      direction: 'high',
      get: (v) => v.specs.rangeKm ?? null,
      spark: true
    },
    {
      type: 'metric',
      section: 'Battery & Range',
      label: 'Battery size',
      key: 'batteryKwh',
      unit: 'kWh',
      direction: 'high',
      get: (v) => v.specs.batteryKwh ?? null
    },
    { type: 'metric', section: 'Performance', label: 'Horsepower', key: 'hp', unit: 'hp', direction: 'high', get: (v) => v.specs.horsepower },
    { type: 'metric', section: 'Performance', label: 'Torque', key: 'torque', unit: 'Nm', direction: 'high', get: (v) => v.specs.torqueNm },
    { type: 'metric', section: 'Performance', label: '0–100', key: 'zeroToHundred', unit: 'seconds', direction: 'low', get: (v) => v.specs.zeroToHundred },
    { type: 'metric', section: 'Dimensions', label: 'Curb weight', key: 'weight', unit: 'kg', direction: 'low', get: (v) => v.specs.curbWeightKg },
    { type: 'metric', section: 'Dimensions', label: 'Length', key: 'length', unit: 'mm', direction: 'high', get: (v) => v.specs.lengthMm },
    { type: 'metric', section: 'Dimensions', label: 'Width', key: 'width', unit: 'mm', direction: 'high', get: (v) => v.specs.widthMm },
    { type: 'metric', section: 'Dimensions', label: 'Height', key: 'height', unit: 'mm', direction: 'high', get: (v) => v.specs.heightMm }
  ]

  const rows: Row[] = []
  const sections = Array.from(new Set(metrics.map((m) => m.section)))
  for (const section of sections) {
    rows.push({ type: 'section', label: section })
    for (const m of metrics.filter((x) => x.section === section)) {
      const values: Record<string, number | string | null> = {}
      for (const v of vehicles) {
        values[v.id] = m.get(v)
      }
      rows.push({ type: 'metric', section, label: m.label, key: m.key, unit: m.unit, direction: m.direction, values, spark: m.spark })
    }
  }
  return rows
}

function buildFeatureRows(vehicles: VehicleByMarket[]): Row[] {
  const rows: Row[] = []
  const sections = [
    { label: 'Packages', key: 'packages', getter: (v: VehicleByMarket) => v.packages },
    { label: 'Options', key: 'options', getter: (v: VehicleByMarket) => v.options }
  ]

  for (const s of sections) {
    rows.push({ type: 'section', label: s.label })

    // Turn packages/options into a stable list of “top” rows + an “All” row.
    const allItems = Array.from(new Set(vehicles.flatMap((v) => s.getter(v)))).sort()
    const top = allItems.slice(0, 8)

    for (const item of top) {
      const values: Record<string, string> = {}
      for (const v of vehicles) {
        values[v.id] = s.getter(v).includes(item) ? 'Included' : '—'
      }
      rows.push({ type: 'metric', section: s.label, label: item, key: `${s.key}_${item}`, values })
    }

    rows.push({
      type: 'metric',
      section: s.label,
      label: 'All',
      key: `${s.key}_all`,
      values: Object.fromEntries(vehicles.map((v) => [v.id, s.getter(v)]))
    })
  }

  return rows
}

function bestInBasket(row: Extract<Row, { type: 'metric' }>, vehicleId: string) {
  const raw = row.values[vehicleId]
  if (typeof raw !== 'number') return false

  const nums = Object.values(row.values).filter((v) => typeof v === 'number') as number[]
  if (!nums.length) return false

  const best = row.direction === 'low' ? Math.min(...nums) : Math.max(...nums)
  return raw === best
}
