'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, LayoutGrid, LineChart, Package2, Tag, ShoppingBasket } from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useBasketStore } from '@/lib/store/basket-store'

import { MarketSelector } from '@/components/app/widgets/market-selector'
import { ThemeSwitch } from '@/components/app/widgets/theme-switch'
import { GlobalSearch } from '@/components/app/widgets/global-search'
import { AccountMenu } from '@/components/app/widgets/account-menu'

const nav = [
  { href: '/', label: 'Model Picker', icon: LayoutGrid },
  { href: '/product-data', label: 'Product Data', icon: Package2 },
  { href: '/strategic-pricing', label: 'Strategic Pricing', icon: LineChart },
  { href: '/tactical-pricing', label: 'Tactical Pricing', icon: Tag },
  { href: '/volume-analysis', label: 'Volume Analysis', icon: BarChart3 }
]

export function TopNav({ onOpenMobileBasket }: { onOpenMobileBasket: () => void }) {
  const pathname = usePathname()
  const count = useBasketStore((s) => s.vehicleIds.length)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1480px] items-center gap-3 px-4 lg:px-6">
        <Link href="/" className="group flex items-center gap-2 rounded-md px-2 py-1 focus-ring">
          <div className="h-8 w-8 rounded-lg bg-accent/15 ring-1 ring-accent/25 grid place-items-center">
            <Tag className="h-4 w-4 text-accent" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">AurumIQ</div>
            <div className="text-[11px] text-muted-foreground">Pricing Intelligence</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {nav.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-ring',
                  active ? 'bg-muted text-fg' : 'text-muted-foreground hover:bg-muted/70 hover:text-fg'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block w-[340px]">
            <GlobalSearch />
          </div>

          <div className="hidden sm:block">
            <MarketSelector />
          </div>

          <ThemeSwitch />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onOpenMobileBasket}
                className="lg:hidden"
                aria-label="Open basket"
              >
                <ShoppingBasket className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Basket ({count})</TooltipContent>
          </Tooltip>

          <AccountMenu />
        </div>
      </div>

      <div className="lg:hidden border-t border-border bg-bg">
        <div className="mx-auto flex max-w-[1480px] items-center gap-2 px-4 py-2">
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <MarketSelector />
        </div>
        <div className="mx-auto flex max-w-[1480px] items-center gap-1 px-4 pb-2">
          {nav.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-2 text-xs transition-colors focus-ring',
                  active ? 'bg-muted text-fg' : 'text-muted-foreground hover:bg-muted/70 hover:text-fg'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xs:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
