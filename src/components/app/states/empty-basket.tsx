import { ShoppingBasket } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EmptyBasketProps {
  title: string
  description?: string
}

export function EmptyBasket({ title, description }: EmptyBasketProps) {
  return (
    <Card className="border-dashed text-center">
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
          <ShoppingBasket className="h-5 w-5" />
        </div>
        <CardTitle className="mt-2">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex items-center justify-center gap-2">
        <Button asChild>
          <Link href="/product-data">Browse product data</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
