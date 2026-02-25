import type { CarouselStateProps } from '@/types/carousel'

export function CarouselState({ status, error, onRetry }: CarouselStateProps) {
  if (status === 'loading') {
    return (
      <section
        aria-label="Image carousel"
        className="w-full rounded-3xl border border-white/10 bg-lacquer/90 p-10 shadow-rail"
      >
        <div className="space-y-4">
          <p className="font-body text-muted text-sm uppercase tracking-[0.24em]">
            Loading
          </p>
          <div
            aria-live="polite"
            className="h-56 animate-pulse rounded-2xl bg-white/10"
          />
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Image carousel"
      className="w-full rounded-3xl border border-danger/40 bg-lacquer/90 p-8 shadow-rail"
    >
      <p className="font-body text-danger text-sm uppercase tracking-[0.24em]">
        Data error
      </p>
      <p className="mt-2 font-body text-muted text-sm">
        {error ?? 'Could not load images.'}
      </p>
      <button
        className="mt-5 rounded-xl border border-gold/55 px-4 py-2 font-body text-ivory text-sm transition hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </section>
  )
}
