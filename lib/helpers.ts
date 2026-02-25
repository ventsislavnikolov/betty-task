import { RAIL_LINE_DELTA_PX } from '@/lib/constants'

export interface WheelModePayload {
  deltaMode: number
}

export function wheelDeltaToPixels(
  delta: number,
  payload: WheelModePayload,
  rail: HTMLDivElement,
): number {
  let modeFactor = 1
  if (payload.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    modeFactor = RAIL_LINE_DELTA_PX
  } else if (payload.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    modeFactor = rail.clientWidth
  }

  return delta * modeFactor
}

export function collectSlideNodes(rail: HTMLDivElement): HTMLElement[] {
  return Array.from(rail.querySelectorAll<HTMLElement>('[data-carousel-slide]'))
}

function findStartSnapTarget(rail: HTMLDivElement): {
  offset: number
} | null {
  const slides = collectSlideNodes(rail)
  if (slides.length === 0) {
    return null
  }

  const paddingLeft =
    Number.parseFloat(getComputedStyle(rail).paddingLeft || '0') || 0
  const targetLeft = rail.scrollLeft + paddingLeft
  let nearestSlide: HTMLElement | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const slide of slides) {
    const distance = Math.abs(targetLeft - slide.offsetLeft)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestSlide = slide
    }
  }

  if (!nearestSlide) {
    return null
  }
  return { offset: nearestSlide.offsetLeft - paddingLeft }
}

export function measureSlideStride(rail: HTMLDivElement): number {
  const slides = collectSlideNodes(rail)
  const deltas: number[] = []
  const sampleSize = Math.min(slides.length, 6)
  for (let index = 1; index < sampleSize; index += 1) {
    const prev = slides[index - 1]
    const next = slides[index]
    if (!(prev && next)) {
      continue
    }

    const stride = Math.abs(next.offsetLeft - prev.offsetLeft)
    if (stride > 0) {
      deltas.push(stride)
    }
  }

  if (deltas.length > 0) {
    const total = deltas.reduce((sum, value) => sum + value, 0)
    return total / deltas.length
  }

  const first = slides[0]
  if (first && first.offsetWidth > 0) {
    return first.offsetWidth
  }
  if (rail.clientWidth > 0) {
    return rail.clientWidth
  }
  return 0
}

export function findNearestStartSnapOffset(
  rail: HTMLDivElement,
): number | null {
  return findStartSnapTarget(rail)?.offset ?? null
}

export function measureLoopSegmentWidth(
  rail: HTMLDivElement,
  cloneCount: number,
  total: number,
  stride: number,
): number {
  const slides = collectSlideNodes(rail)
  const firstReal = slides[cloneCount]
  const firstTailClone = slides[cloneCount + total]

  if (firstReal && firstTailClone) {
    const segmentWidth = Math.abs(
      firstTailClone.offsetLeft - firstReal.offsetLeft,
    )
    if (segmentWidth > 0) {
      return segmentWidth
    }
  }

  if (stride > 0) {
    return stride * total
  }
  return rail.clientWidth
}

export function choosePrimaryAxisDelta(deltaX: number, deltaY: number): number {
  const horizontalWeight = Math.abs(deltaX)
  const verticalWeight = Math.abs(deltaY)
  if (horizontalWeight === 0 && verticalWeight === 0) {
    return 0
  }

  if (horizontalWeight > verticalWeight * 1.2) {
    return deltaX
  }

  return deltaY
}

export function resolveSnapBehavior(): ScrollBehavior {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 'auto'
  }

  return 'smooth'
}
