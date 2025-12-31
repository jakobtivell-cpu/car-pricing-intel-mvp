'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { BasketDock } from '@/components/app/basket-dock'

export function BasketSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent side="bottom" className="p-0">
        <div className="p-4">
          <DialogTitle>Basket</DialogTitle>
        </div>
        <div className="p-4 pt-0">
          {/* Reuse the same premium basket panel */}
          <BasketDock embed />
        </div>
      </DialogContent>
    </Dialog>
  )
}
