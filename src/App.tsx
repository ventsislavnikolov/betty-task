import { CarouselErrorBoundary } from '@/components/CarouselErrorBoundary'
import { CarouselState } from '@/components/CarouselState'
import { InfiniteCarousel } from '@/components/InfiniteCarousel'
import { usePicsumImages } from '@/hooks/usePicsumImages'

function App() {
  const { status, items, error, retry, isOfflineFallback } = usePicsumImages({
    limit: 1000,
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-6 text-ivory sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-12">
        <header className="space-y-2">
          <p className="animate-fade-in-up font-body text-xs uppercase tracking-[0.24em] text-muted/80">
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
                  <p className="font-body text-xs uppercase tracking-[0.18em] text-muted/70">
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

export default App
