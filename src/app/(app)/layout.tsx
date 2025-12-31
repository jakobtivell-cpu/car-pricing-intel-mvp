'use client'

import * as React from 'react'

import { RequireAuth } from '@/components/app/require-auth'
import { TopNav } from '@/components/app/top-nav'
import { BasketDock } from '@/components/app/basket-dock'
import { BasketSheet } from '@/components/app/basket-sheet'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [openBasket, setOpenBasket] = React.useState(false)

  return (
    <RequireAuth>
      <div className="min-h-screen bg-bg">
        <TopNav onOpenMobileBasket={() => setOpenBasket(true)} />

        <div className="mx-auto w-full max-w-[1480px] px-4 lg:px-6 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <main className="min-w-0">{children}</main>
            <aside className="hidden lg:block">
              <BasketDock className="" />
            </aside>
          </div>
        </div>

        <BasketSheet open={openBasket} onOpenChange={setOpenBasket} />
      </div>
    </RequireAuth>
  )
}
