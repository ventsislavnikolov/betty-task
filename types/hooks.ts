import type { RefObject } from 'react'
import type { CarouselItem } from '@/types/carousel'

export type UsePicsumStatus = 'loading' | 'success' | 'error'

export interface UsePicsumImagesArgs {
  initialState?: UsePicsumImagesInitialState
  limit?: number
}

export interface UsePicsumImagesInitialState {
  error: string | null
  isOfflineFallback: boolean
  items: CarouselItem[]
  status: UsePicsumStatus
}

export interface UsePicsumImagesResult {
  error: string | null
  isOfflineFallback: boolean
  items: CarouselItem[]
  retry: () => void
  status: UsePicsumStatus
}

export interface WheelSnapshot {
  axisDelta: number
  deltaMode: number
}

export interface UseWheelRailMotionArgs {
  locked: boolean
  onBeforeSnap?: (rail: HTMLDivElement) => void
  railRef: RefObject<HTMLDivElement | null>
}
