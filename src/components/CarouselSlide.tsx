import { useState } from 'react'
import { CAROUSEL_SLIDE_SIZES } from '@/lib/constants'
import type { CarouselSlideProps } from '@/types/carousel'

export function CarouselSlide({ src, srcSet, alt, eager }: CarouselSlideProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        aria-label={alt}
        className="grid h-full w-full place-items-center bg-fog/10 px-4 text-center font-body text-sm text-muted"
        role="img"
      >
        Image unavailable
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className="h-full w-full object-cover"
      decoding="async"
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setHasError(true)}
      sizes={CAROUSEL_SLIDE_SIZES}
      src={src}
      srcSet={srcSet}
    />
  )
}
