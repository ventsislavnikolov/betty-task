/* biome-ignore-all lint/performance/useTopLevelRegex: test assertions use inline regex for clarity */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { InfiniteCarousel } from '@/components/infinite-carousel'
import { RAIL_HOVER_ACTIVATE_DELAY_MS, RAIL_WHEEL_GAIN } from '@/lib/constants'
import type { CarouselItem } from '@/types/carousel'

const originalMatchMedia = window.matchMedia

function mockMatchMedia(
  prefersReducedMotion: boolean,
  extraMatches: Record<string, boolean> = {},
) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        extraMatches[query] ??
        (query === '(prefers-reduced-motion: reduce)' && prefersReducedMotion),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function mockDesktopMatchMedia() {
  mockMatchMedia(false, {
    '(min-width: 1024px)': true,
    '(min-width: 640px)': true,
  })
}

function mockTabletMatchMedia() {
  mockMatchMedia(false, {
    '(min-width: 1024px)': false,
    '(min-width: 640px)': true,
  })
}

function makeItems(count: number): CarouselItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`,
    src: `https://picsum.photos/id/${index + 1}/1200/800`,
    srcSet: `https://picsum.photos/id/${index + 1}/400/267 400w`,
    alt: `Photo ${index}`,
    aspectRatio: 1.5,
  }))
}

function makeMixedRatioItems(): CarouselItem[] {
  return [
    {
      id: 'landscape',
      src: 'https://picsum.photos/id/1/1200/800',
      srcSet: 'https://picsum.photos/id/1/400/267 400w',
      alt: 'Landscape',
      aspectRatio: 1.5,
    },
    {
      id: 'portrait',
      src: 'https://picsum.photos/id/2/800/1200',
      srcSet: 'https://picsum.photos/id/2/267/400 400w',
      alt: 'Portrait',
      aspectRatio: 2 / 3,
    },
    {
      id: 'square',
      src: 'https://picsum.photos/id/3/1000/1000',
      srcSet: 'https://picsum.photos/id/3/400/400 400w',
      alt: 'Square',
      aspectRatio: 1,
    },
  ]
}

function configureTrackMetrics(
  track: HTMLElement,
  {
    clientWidth,
    slideWidth,
    pitch,
    startLeft = 0,
  }: {
    clientWidth: number
    slideWidth: number
    pitch: number
    startLeft?: number
  },
) {
  Object.defineProperty(track, 'clientWidth', {
    configurable: true,
    value: clientWidth,
  })

  const children = Array.from(track.children) as HTMLElement[]
  for (const [index, child] of children.entries()) {
    Object.defineProperty(child, 'offsetLeft', {
      configurable: true,
      value: startLeft + index * pitch,
    })
    Object.defineProperty(child, 'offsetWidth', {
      configurable: true,
      value: slideWidth,
    })
  }
}

function mockImmediateRaf() {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(16)
    return 1
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    // noop for deterministic test timing
  })
}

function mockQueuedRaf() {
  let nextId = 0
  const callbacks = new Map<number, FrameRequestCallback>()

  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    nextId += 1
    callbacks.set(nextId, callback)
    return nextId
  })

  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    callbacks.delete(id)
  })

  return {
    flush: (time = 16) => {
      const pending = Array.from(callbacks.values())
      callbacks.clear()
      for (const callback of pending) {
        callback(time)
      }
    },
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  })
})

describe('InfiniteCarousel', () => {
  test('renders a scrollable snap carousel region', () => {
    render(<InfiniteCarousel items={makeItems(2)} />)
    expect(
      screen.getByRole('region', { name: /image carousel/i }),
    ).toBeInTheDocument()
  })

  test('renders empty state when items array is empty', () => {
    render(<InfiniteCarousel items={[]} />)
    expect(screen.getByText(/no images available/i)).toBeInTheDocument()
  })

  test('renders single item without crashing', () => {
    render(<InfiniteCarousel items={makeItems(1)} />)
    expect(
      screen.getAllByRole('article', { name: /slide 1 of 1/i }),
    ).toHaveLength(3)
  })

  test('renders full dataset plus clone overhead for 1000 items (mobile default)', () => {
    render(<InfiniteCarousel items={makeItems(1000)} />)
    const slides = screen.getAllByRole('article', { name: /slide/i })
    expect(slides).toHaveLength(1004)
  })

  test('renders 1010 slides for 1000 items at desktop breakpoint', () => {
    mockDesktopMatchMedia()
    render(<InfiniteCarousel items={makeItems(1000)} />)
    const slides = screen.getAllByRole('article', { name: /slide/i })
    expect(slides).toHaveLength(1010)
  })

  test('renders 1006 slides for 1000 items at tablet breakpoint', () => {
    mockTabletMatchMedia()
    render(<InfiniteCarousel items={makeItems(1000)} />)
    const slides = screen.getAllByRole('article', { name: /slide/i })
    expect(slides).toHaveLength(1006)
  })

  test('uses dynamic card width class for all slides', () => {
    render(<InfiniteCarousel items={makeMixedRatioItems()} />)
    const slides = screen.getAllByRole('article', { name: /slide/i })

    for (const slide of slides) {
      expect(slide).toHaveClass('w-[var(--carousel-card-width)]')
      expect(slide).toHaveClass('aspect-[16/9]')
      expect(slide).toHaveClass('flex-none')
    }
  })

  test('renders carousel shell without boxed border frame', () => {
    render(<InfiniteCarousel items={makeItems(5)} />)
    const shell = screen.getByTestId('carousel-shell')
    expect(shell).not.toHaveClass('border')
    expect(shell).not.toHaveClass('rounded-2xl')
  })

  test('keeps slides at neutral scale classes', () => {
    render(<InfiniteCarousel items={makeItems(5)} />)
    const slides = screen.getAllByRole('article', { name: /slide/i })

    for (const slide of slides) {
      expect(slide).toHaveClass('origin-center')
      expect(slide).toHaveClass('scale-100')
      expect(slide).not.toHaveClass('border')
      expect(slide).not.toHaveClass('scale-[1.8]')
    }
  })

  test('does not mark a centered active card by default', () => {
    render(<InfiniteCarousel items={makeItems(5)} />)
    const slides = screen.getAllByRole('article', { name: /slide/i })

    for (const slide of slides) {
      expect(slide).not.toHaveAttribute('data-active-card')
      expect(slide).not.toHaveClass('scale-[1.5]')
    }
  })

  test('does not apply per-item aspect ratio style inline', () => {
    render(<InfiniteCarousel items={makeMixedRatioItems()} />)
    const slides = screen.getAllByRole('article', { name: /slide/i })

    for (const slide of slides) {
      expect(slide.style.getPropertyValue('aspect-ratio')).toBe('')
    }
  })

  test('does not expose aria-current center semantics', () => {
    render(<InfiniteCarousel items={makeItems(3)} />)
    const slides = screen.getAllByRole('article', { name: /slide/i })

    for (const slide of slides) {
      expect(slide).not.toHaveAttribute('aria-current')
    }
  })

  test('renders scroll hint initially', () => {
    render(<InfiniteCarousel items={makeItems(5)} />)
    expect(screen.getByText(/scroll to play/i)).toBeInTheDocument()
  })

  test('does not apply css scroll snapping on track', () => {
    render(<InfiniteCarousel items={makeItems(5)} />)
    const track = screen.getByTestId('carousel-track')

    expect(track).not.toHaveClass('snap-proximity')
    expect(track).not.toHaveClass('snap-x')
  })

  test('translates wheel events to horizontal scrolling', () => {
    mockImmediateRaf()
    render(<InfiniteCarousel items={makeItems(10)} />)
    const track = screen.getByTestId('carousel-track')
    configureTrackMetrics(track, {
      clientWidth: 1000,
      slideWidth: 500,
      pitch: 400,
    })

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    })

    const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault')
    track.dispatchEvent(wheelEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  test('keeps wheel scrolling active while hovering a card', () => {
    mockImmediateRaf()
    render(<InfiniteCarousel items={makeItems(10)} />)
    const track = screen.getByTestId('carousel-track')
    configureTrackMetrics(track, {
      clientWidth: 1000,
      slideWidth: 500,
      pitch: 400,
    })

    const [firstSlide] = screen.getAllByRole('article', { name: /slide/i })
    fireEvent.mouseEnter(firstSlide)

    const scrollBySpy = vi.fn()
    Object.defineProperty(track, 'scrollBy', {
      configurable: true,
      value: scrollBySpy,
    })

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault')
    track.dispatchEvent(wheelEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(scrollBySpy).toHaveBeenCalledTimes(1)
  })

  test('expands only after one second hover delay', () => {
    vi.useFakeTimers()
    render(<InfiniteCarousel items={makeItems(5)} />)
    const [firstSlide] = screen.getAllByRole('article', { name: /slide/i })

    fireEvent.mouseEnter(firstSlide)
    act(() => {
      vi.advanceTimersByTime(RAIL_HOVER_ACTIVATE_DELAY_MS - 1)
    })
    expect(firstSlide).toHaveClass('scale-100')
    expect(firstSlide).not.toHaveClass('scale-[1.8]')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(firstSlide).toHaveClass('scale-[1.35]')

    fireEvent.mouseLeave(firstSlide)
    expect(firstSlide).toHaveClass('scale-100')
    expect(firstSlide).not.toHaveClass('scale-[1.8]')
  })

  test('keeps rail hidden until init frame then reveals it', () => {
    const raf = mockQueuedRaf()
    render(<InfiniteCarousel items={makeItems(10)} />)
    const track = screen.getByTestId('carousel-track')

    expect(track).toHaveClass('opacity-0')

    act(() => {
      raf.flush()
    })

    expect(track).toHaveClass('opacity-100')
  })

  test('aligns to real segment with auto scroll on mount', () => {
    const originalScrollTo = HTMLElement.prototype.scrollTo
    const scrollToSpy = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollToSpy,
    })

    try {
      render(<InfiniteCarousel items={makeItems(10)} />)

      expect(scrollToSpy).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'auto', left: expect.any(Number) }),
      )
    } finally {
      if (originalScrollTo) {
        Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
          configurable: true,
          value: originalScrollTo,
        })
      } else {
        Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
          configurable: true,
          value: undefined,
        })
      }
    }
  })

  test('applies accelerated wheel movement using dominant axis', () => {
    mockImmediateRaf()
    render(<InfiniteCarousel items={makeItems(10)} />)
    const track = screen.getByTestId('carousel-track')
    configureTrackMetrics(track, {
      clientWidth: 1000,
      slideWidth: 500,
      pitch: 400,
    })
    const scrollBySpy = vi.fn()

    Object.defineProperty(track, 'scrollBy', {
      configurable: true,
      value: scrollBySpy,
    })

    track.dispatchEvent(
      new WheelEvent('wheel', {
        deltaX: 160,
        deltaY: 100,
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(scrollBySpy).toHaveBeenCalledWith({
      left: 160 * RAIL_WHEEL_GAIN,
      behavior: 'auto',
    })
  })

  test('normalizes line-mode wheel delta before applying travel', () => {
    mockImmediateRaf()
    render(<InfiniteCarousel items={makeItems(10)} />)
    const track = screen.getByTestId('carousel-track')
    configureTrackMetrics(track, {
      clientWidth: 1000,
      slideWidth: 500,
      pitch: 400,
    })
    const scrollBySpy = vi.fn()

    Object.defineProperty(track, 'scrollBy', {
      configurable: true,
      value: scrollBySpy,
    })

    track.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 10,
        deltaMode: WheelEvent.DOM_DELTA_LINE,
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(scrollBySpy).toHaveBeenCalledWith({
      left: 10 * 16 * RAIL_WHEEL_GAIN,
      behavior: 'auto',
    })
  })

  test('normalizes page-mode wheel delta using track width', () => {
    mockImmediateRaf()
    render(<InfiniteCarousel items={makeItems(10)} />)
    const track = screen.getByTestId('carousel-track')
    const clientWidth = 600
    configureTrackMetrics(track, {
      clientWidth,
      slideWidth: 600,
      pitch: 1000,
    })
    const scrollBySpy = vi.fn()

    Object.defineProperty(track, 'scrollBy', {
      configurable: true,
      value: scrollBySpy,
    })

    track.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 1,
        deltaMode: WheelEvent.DOM_DELTA_PAGE,
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(scrollBySpy).toHaveBeenCalledWith({
      left: clientWidth * RAIL_WHEEL_GAIN,
      behavior: 'auto',
    })
  })

  test('processes at most one wheel update per frame', () => {
    const raf = mockQueuedRaf()
    render(<InfiniteCarousel items={makeItems(10)} />)
    const track = screen.getByTestId('carousel-track')
    configureTrackMetrics(track, {
      clientWidth: 1000,
      slideWidth: 500,
      pitch: 400,
    })
    const scrollBySpy = vi.fn()

    Object.defineProperty(track, 'scrollBy', {
      configurable: true,
      value: scrollBySpy,
    })

    track.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 50,
        bubbles: true,
        cancelable: true,
      }),
    )
    track.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 200,
        bubbles: true,
        cancelable: true,
      }),
    )

    expect(scrollBySpy).not.toHaveBeenCalled()

    act(() => {
      raf.flush()
    })

    expect(scrollBySpy).toHaveBeenCalledTimes(1)
  })

  test('uses latest wheel delta in the same frame', () => {
    const raf = mockQueuedRaf()
    render(<InfiniteCarousel items={makeItems(10)} />)
    const track = screen.getByTestId('carousel-track')
    configureTrackMetrics(track, {
      clientWidth: 1000,
      slideWidth: 500,
      pitch: 400,
    })
    const scrollBySpy = vi.fn()

    Object.defineProperty(track, 'scrollBy', {
      configurable: true,
      value: scrollBySpy,
    })

    track.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 50,
        bubbles: true,
        cancelable: true,
      }),
    )
    track.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: 200,
        bubbles: true,
        cancelable: true,
      }),
    )

    act(() => {
      raf.flush()
    })

    expect(scrollBySpy).toHaveBeenCalledWith({
      left: 200 * RAIL_WHEEL_GAIN,
      behavior: 'auto',
    })
  })

  test('repositions seamlessly when scrolling into tail clone zone', () => {
    render(<InfiniteCarousel items={makeItems(10)} />)
    const track = screen.getByTestId('carousel-track')
    configureTrackMetrics(track, {
      clientWidth: 1000,
      slideWidth: 500,
      pitch: 400,
    })

    let currentLeft = 0
    Object.defineProperty(track, 'scrollLeft', {
      configurable: true,
      get: () => currentLeft,
      set: (value: number) => {
        currentLeft = value
      },
    })

    const scrollToSpy = vi.fn(({ left }: { left: number }) => {
      currentLeft = left
    })
    Object.defineProperty(track, 'scrollTo', {
      configurable: true,
      value: scrollToSpy,
    })

    scrollToSpy.mockClear()
    currentLeft = 6100
    act(() => {
      track.dispatchEvent(new Event('scroll'))
    })

    expect(scrollToSpy).toHaveBeenCalledWith({
      left: 2100,
      behavior: 'auto',
    })
  })
})
