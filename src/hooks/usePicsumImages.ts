import { useCallback, useEffect, useState } from 'react'
import { buildOfflinePlaceholderItems, fetchPicsumImages } from '@/lib/picsum'
import type {
  UsePicsumImagesArgs,
  UsePicsumImagesResult,
  UsePicsumStatus,
} from '@/types/hooks'

export function usePicsumImages({
  limit = 24,
}: UsePicsumImagesArgs = {}): UsePicsumImagesResult {
  const [items, setItems] = useState<UsePicsumImagesResult['items']>([])
  const [status, setStatus] = useState<UsePicsumStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [isOfflineFallback, setIsOfflineFallback] = useState(false)
  const [requestNonce, setRequestNonce] = useState(0)

  const retry = useCallback(() => {
    setStatus('loading')
    setError(null)
    setIsOfflineFallback(false)
    setRequestNonce((current) => current + 1)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: requestNonce is intentional retry trigger
  useEffect(() => {
    const controller = new AbortController()

    fetchPicsumImages(limit, controller.signal)
      .then((nextItems) => {
        setItems(nextItems)
        setStatus('success')
        setError(null)
        setIsOfflineFallback(false)
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return

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
