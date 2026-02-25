import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { CarouselSlide } from '@/components/carousel-slide'
import { useVisibleCardCount } from '@/hooks/use-visible-card-count'
import { useWheelRailMotion } from '@/hooks/use-wheel-rail-motion'
import { RAIL_HOVER_ACTIVATE_DELAY_MS } from '@/lib/constants'
import {
  collectSlideNodes,
  measureLoopSegmentWidth,
  measureSlideStride,
} from '@/lib/helpers'
import type { InfiniteCarouselProps, RenderSlide } from '@/types/carousel'

export function InfiniteCarousel({ items }: InfiniteCarouselProps) {
  const total = items.length
  const visibleCardCount = useVisibleCardCount()
  const cloneCount = Math.min(visibleCardCount, total)
  const [expandedRenderIndex, setExpandedRenderIndex] = useState<number | null>(
    null,
  )
  const [isRailInitialized, setIsRailInitialized] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hoverExpandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const isLoopAdjustmentRef = useRef(false)
  const hasInitializedOnceRef = useRef(false)

  useLayoutEffect(() => {
    const track = containerRef.current
    if (!track) {
      return
    }

    const updateCardWidth = () => {
      const computed = window.getComputedStyle(track)
      const gap =
        Number.parseFloat(computed.columnGap || computed.gap || '0') || 0
      const paddingLeft = Number.parseFloat(computed.paddingLeft || '0') || 0
      const paddingRight = Number.parseFloat(computed.paddingRight || '0') || 0
      const innerWidth = Math.max(
        0,
        track.clientWidth - paddingLeft - paddingRight,
      )
      const width =
        (innerWidth - gap * (visibleCardCount - 1)) / visibleCardCount

      track.style.setProperty(
        '--carousel-card-width',
        `${Math.max(0, width)}px`,
      )
    }

    updateCardWidth()

    if (typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver(updateCardWidth)
    observer.observe(track)
    return () => observer.disconnect()
  }, [visibleCardCount])

  const renderedSlides = useMemo<RenderSlide[]>(() => {
    if (total === 0) {
      return []
    }

    const headClones = items
      .slice(total - cloneCount)
      .map((item, cloneIndex) => {
        const logicalIndex = total - cloneCount + cloneIndex
        return {
          key: `${item.id}-head-${logicalIndex}`,
          logicalIndex,
          itemIndex: logicalIndex,
        }
      })

    const realSlides = items.map((item, index) => ({
      key: `${item.id}-real-${index}`,
      logicalIndex: index,
      itemIndex: index,
    }))

    const tailClones = items.slice(0, cloneCount).map((item, cloneIndex) => ({
      key: `${item.id}-tail-${cloneIndex}`,
      logicalIndex: cloneIndex,
      itemIndex: cloneIndex,
    }))

    return [...headClones, ...realSlides, ...tailClones]
  }, [cloneCount, items, total])

  const applyInfiniteLoopBounds = useCallback(
    (track: HTMLDivElement) => {
      if (total === 0 || cloneCount === 0) {
        return
      }

      const slides = collectSlideNodes(track)
      const firstReal = slides[cloneCount]
      const firstTailClone = slides[cloneCount + total]
      if (!(firstReal && firstTailClone)) {
        return
      }

      const pitch = measureSlideStride(track)
      const realSegmentWidth = measureLoopSegmentWidth(
        track,
        cloneCount,
        total,
        pitch,
      )
      if (realSegmentWidth <= 0) {
        return
      }

      const halfPitch = pitch > 0 ? pitch / 2 : 0
      const leftBoundary = firstReal.offsetLeft - halfPitch
      const rightBoundary = firstTailClone.offsetLeft - halfPitch

      let nextLeft: number | null = null
      if (track.scrollLeft < leftBoundary) {
        nextLeft = track.scrollLeft + realSegmentWidth
      } else if (track.scrollLeft >= rightBoundary) {
        nextLeft = track.scrollLeft - realSegmentWidth
      }

      if (nextLeft == null) {
        return
      }

      isLoopAdjustmentRef.current = true
      if (typeof track.scrollTo === 'function') {
        track.scrollTo({ left: nextLeft, behavior: 'auto' })
      } else {
        track.scrollLeft = nextLeft
      }

      requestAnimationFrame(() => {
        isLoopAdjustmentRef.current = false
      })
    },
    [cloneCount, total],
  )

  const onScroll = useCallback(() => {
    const track = containerRef.current
    if (!track || isLoopAdjustmentRef.current) {
      return
    }

    applyInfiniteLoopBounds(track)
  }, [applyInfiniteLoopBounds])

  const clearHoverExpandTimer = useCallback(() => {
    if (!hoverExpandTimeoutRef.current) {
      return
    }
    clearTimeout(hoverExpandTimeoutRef.current)
    hoverExpandTimeoutRef.current = null
  }, [])

  const scheduleExpandCard = useCallback(
    (renderIndex: number) => {
      clearHoverExpandTimer()
      hoverExpandTimeoutRef.current = setTimeout(() => {
        setExpandedRenderIndex(renderIndex)
        hoverExpandTimeoutRef.current = null
      }, RAIL_HOVER_ACTIVATE_DELAY_MS)
    },
    [clearHoverExpandTimer],
  )

  const collapseExpandedCard = useCallback(() => {
    clearHoverExpandTimer()
    setExpandedRenderIndex(null)
  }, [clearHoverExpandTimer])

  useWheelRailMotion({
    railRef: containerRef,
    locked: false,
    onBeforeSnap: applyInfiniteLoopBounds,
  })

  useLayoutEffect(() => {
    const track = containerRef.current
    if (!track || total === 0 || cloneCount === 0) {
      setIsRailInitialized(true)
      return
    }

    if (!hasInitializedOnceRef.current) {
      setIsRailInitialized(false)
    }

    const slides = collectSlideNodes(track)
    const firstReal = slides[cloneCount]
    if (firstReal) {
      const paddingLeft =
        Number.parseFloat(getComputedStyle(track).paddingLeft || '0') || 0
      const scrollTarget = firstReal.offsetLeft - paddingLeft
      if (typeof track.scrollTo === 'function') {
        track.scrollTo({ left: scrollTarget, behavior: 'auto' })
      } else {
        track.scrollLeft = scrollTarget
      }
    }

    const frame = requestAnimationFrame(() => {
      hasInitializedOnceRef.current = true
      setIsRailInitialized(true)
    })

    return () => cancelAnimationFrame(frame)
  }, [cloneCount, total])

  useEffect(() => {
    const track = containerRef.current
    if (!track) {
      return
    }
    track.tabIndex = 0
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
      ) {
        event.preventDefault()
      }
    }
    track.addEventListener('keydown', handleKeyDown)
    return () => {
      track.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(
    () => () => {
      clearHoverExpandTimer()
    },
    [clearHoverExpandTimer],
  )

  if (total === 0) {
    return (
      <section aria-label="Image carousel" className="w-full">
        <div className="rounded-2xl border border-white/10 bg-lacquer/90 p-6 text-muted">
          No images available.
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Image carousel"
      aria-roledescription="carousel"
      className="w-full"
    >
      <div className="relative" data-testid="carousel-shell">
        <div
          className={[
            'carousel-track relative box-border flex gap-[var(--carousel-gap)] overflow-x-auto px-2 py-6 [--carousel-gap:0.75rem] focus:outline-none sm:px-3 sm:py-8 sm:[--carousel-gap:1rem]',
            'transition-opacity duration-100',
            isRailInitialized ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          data-testid="carousel-track"
          onScroll={onScroll}
          ref={containerRef}
          style={
            {
              '--carousel-card-width': `calc((100% - var(--carousel-gap) * ${visibleCardCount - 1}) / ${visibleCardCount})`,
            } as React.CSSProperties
          }
        >
          {renderedSlides.map((slide, renderIndex) => {
            const item = items[slide.itemIndex]

            return (
              // biome-ignore lint/a11y/noNoninteractiveElementInteractions: hover expansion is visual and intentionally attached to each slide container
              <article
                aria-label={`Slide ${slide.logicalIndex + 1} of ${total}`}
                className={[
                  'aspect-[16/9] w-[var(--carousel-card-width)] flex-none overflow-hidden rounded-xl bg-black/20',
                  'origin-center transition-[transform,filter,box-shadow] duration-300 ease-out will-change-transform',
                  expandedRenderIndex === renderIndex
                    ? 'z-30 -translate-y-1 scale-[1.35] shadow-[0_32px_56px_-28px_rgba(0,0,0,0.9)]'
                    : 'z-0 scale-100',
                  'contain-[layout_style]',
                  renderIndex > visibleCardCount * 2
                    ? 'content-visibility-auto'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-carousel-slide
                key={slide.key}
                onMouseEnter={() => scheduleExpandCard(renderIndex)}
                onMouseLeave={collapseExpandedCard}
              >
                <CarouselSlide
                  alt={item.alt}
                  eager={renderIndex < visibleCardCount * 2}
                  src={item.src}
                  srcSet={item.srcSet}
                />
              </article>
            )
          })}
        </div>
      </div>

      <p
        aria-hidden="true"
        className="mt-3 text-center font-body text-[10px] text-muted/50 uppercase tracking-[0.3em]"
      >
        Scroll to play and hover to enlarge
      </p>
    </section>
  )
}
