import { Loader2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoadingBlockProps {
  title: string
  description?: string
}

export function LoadingBlock({ title, description }: LoadingBlockProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
      </CardContent>
    </Card>
  )
}
