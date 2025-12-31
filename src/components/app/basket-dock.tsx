'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Download, Save, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { useBasketStore } from '@/lib/store/basket-store'
import { useMarketStore } from '@/lib/store/market-store'
import { useAsync } from '@/lib/utils/use-async'
import { getVehiclesByIds } from '@/lib/api/vehicles'
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'


function SortRow({ id, name, sub, badges, onRemove }: { id: string; name: string; sub: string; badges: string[]; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        'flex items-start gap-2 rounded-lg border border-border bg-card p-3 transition-shadow ' +
        (isDragging ? 'shadow-float' : 'hover:shadow-card')
      }
    >
      <button
        type="button"
        className="mt-0.5 rounded-md p-1 text-muted-foreground hover:bg-muted focus-ring"
        aria-label="Reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <Badge key={b} variant="accent" className="text-[11px]">
              {b}
            </Badge>
          ))}
        </div>
      </div>

      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function BasketDock({ className, embed }: { className?: string; embed?: boolean }) {
  const market = useMarketStore((s) => s.market)
  const vehicleIds = useBasketStore((s) => s.vehicleIds)
  const remove = useBasketStore((s) => s.remove)
  const clear = useBasketStore((s) => s.clear)
  const reorder = useBasketStore((s) => s.reorder)
  const saved = useBasketStore((s) => s.saved)
  const saveCurrent = useBasketStore((s) => s.saveCurrent)
  const load = useBasketStore((s) => s.load)
  const deleteSaved = useBasketStore((s) => s.deleteSaved)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const { data, loading } = useAsync(() => getVehiclesByIds(vehicleIds, market), [vehicleIds.join('|'), market])

  const items = data ?? []

  const [saveName, setSaveName] = React.useState('')

  return (
    <aside className={cn(embed ? '' : 'sticky top-20', className)} aria-label="Basket">
      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">Basket</div>
              <Badge className="mono-num" variant={vehicleIds.length >= 2 ? 'accent' : 'default'}>
                {vehicleIds.length}
              </Badge>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">Compare across all pages</div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!vehicleIds.length}>
            Clear
          </Button>
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <Button asChild variant="default" className="flex-1" disabled={vehicleIds.length < 2}>
              <Link href="/product-data" aria-disabled={vehicleIds.length < 2}>
                <Sparkles className="mr-2 h-4 w-4" />
                Compare
              </Link>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Save / Load">
                  <Save className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save / Load Basket</DialogTitle>
                  <DialogDescription>
                    Save a named set of models, or load a previous basket to continue analysis.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Name (e.g., BEV vs PHEV shortlist)"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        saveCurrent(saveName)
                        setSaveName('')
                      }}
                      disabled={!vehicleIds.length}
                    >
                      Save
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {saved.length ? (
                      saved.slice(0, 8).map((b) => (
                        <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{b.name}</div>
                            <div className="text-xs text-muted-foreground">{b.vehicleIds.length} items</div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => load(b.id)}>
                              Load
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => deleteSaved(b.id)} aria-label="Delete saved basket">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        No saved baskets yet.
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export (coming soon)
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => {}}>
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-muted animate-pulse" />
                <div className="h-16 rounded-lg bg-muted animate-pulse" />
              </div>
            ) : !vehicleIds.length ? (
              <div className="rounded-lg border border-dashed border-border p-4">
                <div className="text-sm font-medium">Your basket is empty</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Add 2+ vehicles from the Model Picker to unlock comparisons.
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event
                  if (!over) return
                  if (active.id === over.id) return
                  const oldIndex = vehicleIds.indexOf(String(active.id))
                  const newIndex = vehicleIds.indexOf(String(over.id))
                  reorder(arrayMove(vehicleIds, oldIndex, newIndex))
                }}
              >
                <SortableContext items={vehicleIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {items.map((v) => (
                      <SortRow
                        key={v.id}
                        id={v.id}
                        name={`${v.brand} ${v.model}`}
                        sub={`${v.trim} • ${v.powertrain} • MSRP ${formatCurrency(v.msrp, market)}`}
                        badges={[v.powertrain, v.bodyType, v.drivetrain]}
                        onRemove={() => remove(v.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Tip: Use keyboard focus rings everywhere — this MVP is built to be navigable without a mouse.
      </div>
    </aside>
  )
}
