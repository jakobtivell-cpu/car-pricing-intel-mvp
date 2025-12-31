'use client'

import { Building2, Palette } from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { describeTheme } from '@/lib/theme/theme'
import { useThemeStore } from '@/lib/theme/use-theme-store'

export function ThemeSwitch() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const checked = theme === 'colorful'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {checked ? <Palette className="h-3.5 w-3.5 text-accent" /> : <Building2 className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{checked ? 'Colorful' : 'Office'}</span>
          </div>
          <Switch
            checked={checked}
            onCheckedChange={(v) => setTheme(v ? 'colorful' : 'office')}
            aria-label="Toggle theme"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>{describeTheme(theme)}</TooltipContent>
    </Tooltip>
  )
}
