import { OFFLINE_ASPECT_RATIO, PICSUM_PAGE_SIZE } from '@/lib/constants'
import type { CarouselItem } from '@/types/carousel'
import type { PicsumItem } from '@/types/picsum'

const offlinePlaceholder = '/offline-placeholder.svg'

function buildSrcSet(id: string, aspectRatio: number): string {
  const widths = [400, 800, 1200]
  return widths
    .map((w) => {
      const h = Math.round(w / aspectRatio)
      return `https://picsum.photos/id/${id}/${w}/${h} ${w}w`
    })
    .join(', ')
}

function mapItems(payload: PicsumItem[]): CarouselItem[] {
  return payload.map((item) => {
    const aspectRatio = item.width / item.height
    const h = Math.round(1200 / aspectRatio)
    return {
      id: item.id,
      src: `https://picsum.photos/id/${item.id}/1200/${h}`,
      srcSet: buildSrcSet(item.id, aspectRatio),
      alt: `Photo by ${item.author}`,
      aspectRatio,
    }
  })
}

export function buildOfflinePlaceholderItems(limit = 100): CarouselItem[] {
  const boundedLimit = Math.max(0, Math.floor(limit))
  const srcSet = [
    `${offlinePlaceholder} 400w`,
    `${offlinePlaceholder} 800w`,
    `${offlinePlaceholder} 1200w`,
  ].join(', ')

  return Array.from({ length: boundedLimit }, (_, index) => ({
    id: `offline-${index}`,
    src: offlinePlaceholder,
    srcSet,
    alt: 'Offline placeholder image',
    aspectRatio: OFFLINE_ASPECT_RATIO,
  }))
}

export async function fetchPicsumImages(
  limit = 100,
  signal?: AbortSignal,
): Promise<CarouselItem[]> {
  const apiBase = process.env.NEXT_PUBLIC_PICSUM_API_BASE?.trim()
  if (!apiBase) {
    throw new Error('Missing NEXT_PUBLIC_PICSUM_API_BASE')
  }

  const pageCount = Math.ceil(limit / PICSUM_PAGE_SIZE)
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)

  const results = await Promise.all(
    pages.map(async (page) => {
      const pageLimit = Math.min(
        PICSUM_PAGE_SIZE,
        limit - (page - 1) * PICSUM_PAGE_SIZE,
      )
      const url = `${apiBase}/v2/list?page=${page}&limit=${pageLimit}`
      const response = await fetch(url, { signal })

      if (!response.ok) {
        throw new Error(`Picsum request failed: ${response.status}`)
      }

      return (await response.json()) as PicsumItem[]
    }),
  )

  return mapItems(results.flat()).slice(0, limit)
}
