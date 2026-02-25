import { CarouselPageClient } from '@/components/carousel-page-client'
import { PICSUM_DEFAULT_LIMIT } from '@/lib/constants'
import { fetchPicsumImages } from '@/lib/picsum'
import type { UsePicsumImagesInitialState } from '@/types/hooks'

export const dynamic = 'force-dynamic'

async function getInitialState(): Promise<UsePicsumImagesInitialState> {
  try {
    const items = await fetchPicsumImages(PICSUM_DEFAULT_LIMIT)
    return {
      error: null,
      isOfflineFallback: false,
      items,
      status: 'success',
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown fetch error'

    return {
      error: message,
      isOfflineFallback: false,
      items: [],
      status: 'error',
    }
  }
}

export default async function Page() {
  const initialState = await getInitialState()

  return (
    <CarouselPageClient
      initialState={initialState}
      limit={PICSUM_DEFAULT_LIMIT}
    />
  )
}
