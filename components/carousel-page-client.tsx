'use client'

import { CarouselErrorBoundary } from '@/components/carousel-error-boundary'
import { CarouselState } from '@/components/carousel-state'
import { InfiniteCarousel } from '@/components/infinite-carousel'
import { usePicsumImages } from '@/hooks/use-picsum-images'
import { PICSUM_DEFAULT_LIMIT } from '@/lib/constants'
import type { UsePicsumImagesInitialState } from '@/types/hooks'

interface CarouselPageClientProps {
  initialState: UsePicsumImagesInitialState
  limit?: number
}

export function CarouselPageClient({
  initialState,
  limit = PICSUM_DEFAULT_LIMIT,
}: CarouselPageClientProps) {
  const { status, items, error, retry, isOfflineFallback } = usePicsumImages({
    initialState,
    limit,
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-6 text-ivory sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-12">
        <header className="space-y-2">
          <p className="animate-fade-in-up font-body text-muted/80 text-xs uppercase tracking-[0.24em]">
            Betty Interview Task
          </p>
          <h1
            className="animate-fade-in-up font-display text-4xl leading-[0.95] sm:text-5xl"
            style={{ animationDelay: '150ms' }}
          >
            Betty Infinite Carousel
          </h1>
        </header>
        <div className="animate-fade-in-up" style={{ animationDelay: '380ms' }}>
          <CarouselErrorBoundary>
            {status === 'success' ? (
              <div className="space-y-2">
                {isOfflineFallback ? (
                  <p className="font-body text-muted/70 text-xs uppercase tracking-[0.18em]">
                    Offline placeholder mode
                  </p>
                ) : null}
                <InfiniteCarousel items={items} />
              </div>
            ) : (
              <CarouselState error={error} onRetry={retry} status={status} />
            )}
          </CarouselErrorBoundary>
        </div>
      </div>
    </main>
  )
}
