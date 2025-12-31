'use client'

import * as React from 'react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { applyThemeToDocument } from '@/lib/theme/theme'
import { useThemeStore } from '@/lib/theme/use-theme-store'

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  React.useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  return <TooltipProvider delayDuration={120}>{children}</TooltipProvider>
}
