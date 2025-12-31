'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/'

  const login = useAuthStore((s) => s.login)
  const user = useAuthStore((s) => s.user)

  const [email, setEmail] = React.useState('jakob.tivell@gmail.com')
  const [password, setPassword] = React.useState('demo')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (user) router.replace(next)
  }, [user, router, next])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-accent/15 ring-1 ring-accent/25 grid place-items-center">
            <KeyRound className="h-4 w-4 text-accent" />
          </div>
          <div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Mock authentication for B2B workflows</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setLoading(true)
            const res = await login(email, password)
            setLoading(false)
            if (!res.ok) {
              setError(res.error)
              return
            }
            router.replace(next)
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••" />
          </div>
          {error ? <div className="rounded-md border border-danger/30 bg-danger/10 p-2 text-sm text-fg">{error}</div> : null}
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <div className="text-xs text-muted-foreground">
            Demo mode: any valid email + any password works.
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
