import type { ThemeMode } from '@/lib/theme/use-theme-store'

export function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

export function describeTheme(theme: ThemeMode) {
  return theme === 'office'
    ? 'Office: restrained enterprise palette, minimal emphasis, calm visuals.'
    : 'Colorful: richer accents for charts & highlights while keeping surfaces calm.'
}
