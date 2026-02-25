import { useCallback, useEffect, useRef, useState } from 'react'
import { buildOfflinePlaceholderItems, fetchPicsumImages } from '@/lib/picsum'
import type {
  UsePicsumImagesArgs,
  UsePicsumImagesInitialState,
  UsePicsumImagesResult,
  UsePicsumStatus,
} from '@/types/hooks'

export function usePicsumImages({
  initialState,
  limit = 24,
}: UsePicsumImagesArgs = {}): UsePicsumImagesResult {
  const resolvedInitialState: UsePicsumImagesInitialState = initialState ?? {
    error: null,
    isOfflineFallback: false,
    items: [],
    status: 'loading',
  }
  const [items, setItems] = useState<UsePicsumImagesResult['items']>(
    resolvedInitialState.items,
  )
  const [status, setStatus] = useState<UsePicsumStatus>(
    resolvedInitialState.status,
  )
  const [error, setError] = useState<string | null>(resolvedInitialState.error)
  const [isOfflineFallback, setIsOfflineFallback] = useState(
    resolvedInitialState.isOfflineFallback,
  )
  const [requestNonce, setRequestNonce] = useState(0)
  const shouldFetchOnMountRef = useRef(
    resolvedInitialState.status !== 'success',
  )

  const retry = useCallback(() => {
    setStatus('loading')
    setError(null)
    setIsOfflineFallback(false)
    setRequestNonce((current) => current + 1)
  }, [])

  useEffect(() => {
    if (requestNonce === 0 && !shouldFetchOnMountRef.current) {
      return
    }
    shouldFetchOnMountRef.current = false

    const controller = new AbortController()

    fetchPicsumImages(limit, controller.signal)
      .then((nextItems) => {
        setItems(nextItems)
        setStatus('success')
        setError(null)
        setIsOfflineFallback(false)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        const isOffline =
          typeof navigator !== 'undefined' && navigator.onLine === false

        if (isOffline) {
          setItems(buildOfflinePlaceholderItems(limit))
          setStatus('success')
          setError(null)
          setIsOfflineFallback(true)
          return
        }

        setItems([])
        setStatus('error')
        setIsOfflineFallback(false)
        const message =
          reason instanceof Error ? reason.message : 'Unknown fetch error'
        setError(message)
      })

    return () => {
      controller.abort()
    }
  }, [limit, requestNonce])

  return { status, items, error, retry, isOfflineFallback }
}
