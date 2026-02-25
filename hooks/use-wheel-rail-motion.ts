import { useEffect, useRef } from 'react'
import { RAIL_WHEEL_GAIN } from '@/lib/constants'
import { choosePrimaryAxisDelta, wheelDeltaToPixels } from '@/lib/helpers'
import type { UseWheelRailMotionArgs, WheelSnapshot } from '@/types/hooks'

export function useWheelRailMotion({
  railRef,
  locked,
  onBeforeSnap: _onBeforeSnap,
}: UseWheelRailMotionArgs) {
  const lockedRef = useRef(locked)
  const frameRequestRef = useRef<number | null>(null)
  const queuedWheelRef = useRef<WheelSnapshot | null>(null)

  useEffect(() => {
    lockedRef.current = locked
  }, [locked])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) {
      return
    }

    const flushQueuedWheel = () => {
      frameRequestRef.current = null
      const wheelSnapshot = queuedWheelRef.current
      queuedWheelRef.current = null
      if (!wheelSnapshot) {
        return
      }

      const pxDelta = wheelDeltaToPixels(
        wheelSnapshot.axisDelta,
        { deltaMode: wheelSnapshot.deltaMode },
        rail,
      )
      const travel = pxDelta * RAIL_WHEEL_GAIN

      if (travel === 0) {
        return
      }

      if (typeof rail.scrollBy === 'function') {
        rail.scrollBy({ left: travel, behavior: 'auto' })
      } else {
        rail.scrollLeft += travel
      }
    }

    const onWheel = (event: WheelEvent) => {
      if (lockedRef.current) {
        event.preventDefault()
        return
      }

      const axisDelta = choosePrimaryAxisDelta(event.deltaX, event.deltaY)
      if (axisDelta === 0) {
        return
      }

      event.preventDefault()
      queuedWheelRef.current = {
        axisDelta,
        deltaMode: event.deltaMode,
      }

      if (frameRequestRef.current == null) {
        frameRequestRef.current = requestAnimationFrame(flushQueuedWheel)
      }
    }

    rail.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      rail.removeEventListener('wheel', onWheel)
      if (frameRequestRef.current != null) {
        cancelAnimationFrame(frameRequestRef.current)
        frameRequestRef.current = null
      }
      queuedWheelRef.current = null
    }
  }, [railRef])
}
