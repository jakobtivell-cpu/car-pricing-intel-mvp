import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorStateProps {
  title: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          {message ? <CardDescription className="mt-1">{message}</CardDescription> : null}
        </div>
      </CardHeader>
      {onRetry ? (
        <CardContent>
          <Button onClick={onRetry}>Try again</Button>
        </CardContent>
      ) : null}
    </Card>
  )
}
