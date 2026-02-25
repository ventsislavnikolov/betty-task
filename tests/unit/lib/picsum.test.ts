/* biome-ignore-all lint/performance/useTopLevelRegex: test helpers use inline regex for concise parsing */
import { afterEach, describe, expect, test, vi } from 'vitest'
import { buildOfflinePlaceholderItems, fetchPicsumImages } from '@/lib/picsum'

describe('fetchPicsumImages', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('throws when NEXT_PUBLIC_PICSUM_API_BASE is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_PICSUM_API_BASE', '')

    await expect(fetchPicsumImages(3)).rejects.toThrow(
      'Missing NEXT_PUBLIC_PICSUM_API_BASE',
    )
  })

  test('maps API response to CarouselItem with aspectRatio and srcSet', async () => {
    vi.stubEnv('NEXT_PUBLIC_PICSUM_API_BASE', 'https://picsum.photos')

    const mockPayload = [
      {
        id: '10',
        author: 'Paul Jarvis',
        width: 2500,
        height: 1667,
        url: 'https://unsplash.com/photos/6J--NXulQCs',
        download_url: 'https://picsum.photos/id/10/2500/1667',
      },
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPayload),
      }),
    )

    const items = await fetchPicsumImages(1)

    expect(items).toHaveLength(1)
    expect(items[0]).toEqual({
      id: '10',
      alt: 'Photo by Paul Jarvis',
      src: 'https://picsum.photos/id/10/1200/800',
      srcSet:
        'https://picsum.photos/id/10/400/267 400w, https://picsum.photos/id/10/800/533 800w, https://picsum.photos/id/10/1200/800 1200w',
      aspectRatio: 2500 / 1667,
    })
  })

  test('passes AbortSignal to fetch when provided', async () => {
    vi.stubEnv('NEXT_PUBLIC_PICSUM_API_BASE', 'https://picsum.photos')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: '1',
            author: 'A',
            width: 800,
            height: 600,
            url: '',
            download_url: '',
          },
        ]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const controller = new AbortController()
    await fetchPicsumImages(1, controller.signal)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    )
  })

  test('fetches multiple pages when limit exceeds 100', async () => {
    vi.stubEnv('NEXT_PUBLIC_PICSUM_API_BASE', 'https://picsum.photos')

    const makePage = (page: number) =>
      Array.from({ length: 100 }, (_, i) => ({
        id: `${(page - 1) * 100 + i}`,
        author: `Author ${(page - 1) * 100 + i}`,
        width: 800,
        height: 600,
        url: '',
        download_url: '',
      }))

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      const pageMatch = url.match(/page=(\d+)/)
      const page = pageMatch ? Number(pageMatch[1]) : 1
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makePage(page)),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const items = await fetchPicsumImages(250)

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(items).toHaveLength(250)
    expect(items[0].id).toBe('0')
    expect(items[100].id).toBe('100')
    expect(items[249].id).toBe('249')
  })

  test('builds deterministic offline placeholder items', () => {
    const items = buildOfflinePlaceholderItems(3)

    expect(items).toHaveLength(3)
    expect(items[0].id).toBe('offline-0')
    expect(items[1].id).toBe('offline-1')
    expect(items[2].id).toBe('offline-2')
    expect(items[0].src).toBe('/offline-placeholder.svg')
    expect(items[0].srcSet).toContain('400w')
    expect(items[0].srcSet).toContain('800w')
    expect(items[0].srcSet).toContain('1200w')
    expect(items[0].alt).toBe('Offline placeholder image')
    expect(items[0].aspectRatio).toBe(16 / 9)
  })
})
