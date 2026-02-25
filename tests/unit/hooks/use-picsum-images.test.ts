import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { usePicsumImages } from '@/hooks/use-picsum-images'
import { buildOfflinePlaceholderItems, fetchPicsumImages } from '@/lib/picsum'

vi.mock('@/lib/picsum', () => ({
  fetchPicsumImages: vi.fn(),
  buildOfflinePlaceholderItems: vi.fn(),
}))

describe('usePicsumImages', () => {
  afterEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })
  })

  test('transitions to success and exposes items', async () => {
    vi.mocked(fetchPicsumImages).mockResolvedValueOnce([
      {
        id: '1',
        src: 'https://picsum.photos/id/1/1200/800',
        srcSet: 'https://picsum.photos/id/1/400/267 400w',
        alt: 'Photo by A',
        aspectRatio: 1.5,
      },
    ])

    const { result } = renderHook(() => usePicsumImages({ limit: 1 }))

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.isOfflineFallback).toBe(false)
  })

  test('uses server-provided initial success state without initial refetch', () => {
    const initialItems = [
      {
        id: 'seed-1',
        src: 'https://picsum.photos/id/1/1200/800',
        srcSet: 'https://picsum.photos/id/1/400/267 400w',
        alt: 'Photo by Seed',
        aspectRatio: 1.5,
      },
    ]

    const { result } = renderHook(() =>
      usePicsumImages({
        initialState: {
          error: null,
          isOfflineFallback: false,
          items: initialItems,
          status: 'success',
        },
        limit: 1,
      }),
    )

    expect(result.current.status).toBe('success')
    expect(result.current.items).toEqual(initialItems)
    expect(fetchPicsumImages).not.toHaveBeenCalled()
  })

  test('passes AbortSignal to fetchPicsumImages', async () => {
    vi.mocked(fetchPicsumImages).mockResolvedValueOnce([])

    const { result } = renderHook(() => usePicsumImages({ limit: 1 }))

    await waitFor(() => expect(result.current.status).toBe('success'))

    expect(fetchPicsumImages).toHaveBeenCalledWith(1, expect.any(AbortSignal))
  })

  test('uses offline placeholder items when request fails and browser is offline', async () => {
    const placeholderItems = [
      {
        id: 'offline-0',
        src: '/offline-placeholder.svg',
        srcSet: '/offline-placeholder.svg 400w',
        alt: 'Offline placeholder image',
        aspectRatio: 16 / 9,
      },
    ]

    vi.mocked(fetchPicsumImages).mockRejectedValueOnce(
      new Error('Network down'),
    )
    vi.mocked(buildOfflinePlaceholderItems).mockReturnValueOnce(
      placeholderItems,
    )

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })

    const { result } = renderHook(() => usePicsumImages({ limit: 1000 }))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.items).toEqual(placeholderItems)
    expect(result.current.error).toBeNull()
    expect(result.current.isOfflineFallback).toBe(true)
    expect(buildOfflinePlaceholderItems).toHaveBeenCalledWith(1000)
  })

  test('keeps error state when request fails while browser is online', async () => {
    vi.mocked(fetchPicsumImages).mockRejectedValueOnce(
      new Error('Server unavailable'),
    )

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })

    const { result } = renderHook(() => usePicsumImages({ limit: 1 }))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.items).toEqual([])
    expect(result.current.error).toBe('Server unavailable')
    expect(result.current.isOfflineFallback).toBe(false)
  })

  test('aborts fetch on unmount', async () => {
    let capturedSignal: AbortSignal | undefined
    vi.mocked(fetchPicsumImages).mockImplementation((_limit, signal) => {
      capturedSignal = signal
      return Promise.resolve([])
    })

    const { unmount } = renderHook(() => usePicsumImages({ limit: 1 }))

    await waitFor(() => expect(capturedSignal).toBeDefined())
    expect(capturedSignal?.aborted).toBe(false)

    unmount()

    expect(capturedSignal?.aborted).toBe(true)
  })
})
