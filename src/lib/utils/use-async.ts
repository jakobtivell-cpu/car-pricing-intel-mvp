'use client'

import * as React from 'react'

type AsyncState<T> = {
  data: T | null
  error: string | null
  loading: boolean
}

export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const [state, setState] = React.useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true
  })

  const run = React.useCallback(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => {
        if (cancelled) return
        setState({ data, error: null, loading: false })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ data: null, error: message, loading: false })
      })

    return () => {
      cancelled = true
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const cancel = run()
    return cancel
  }, [run])

  return { ...state, refetch: run }
}
