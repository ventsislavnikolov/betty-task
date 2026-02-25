import type { RefObject } from 'react'
import type { CarouselItem } from '@/types/carousel'

export type UsePicsumStatus = 'loading' | 'success' | 'error'

export type UsePicsumImagesArgs = {
  limit?: number
}

export type UsePicsumImagesResult = {
  status: UsePicsumStatus
  items: CarouselItem[]
  error: string | null
  retry: () => void
  isOfflineFallback: boolean
}

export type WheelSnapshot = {
  axisDelta: number
  deltaMode: number
}

export type UseWheelRailMotionArgs = {
  railRef: RefObject<HTMLDivElement | null>
  locked: boolean
  onBeforeSnap?: (rail: HTMLDivElement) => void
}
