'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { useAuthStore } from '@/lib/store/auth-store'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`)
    }
  }, [user, router, pathname])

  if (!user) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="card-surface p-6">
          <div className="text-sm text-muted-foreground">Checking session…</div>
          <div className="mt-4 h-2 w-full rounded bg-muted" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
