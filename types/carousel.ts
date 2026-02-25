export interface CarouselSlideProps {
  alt: string
  eager: boolean
  src: string
  srcSet: string
}

import type { ReactNode } from 'react'

export interface CarouselErrorBoundaryProps {
  children: ReactNode
}

export interface CarouselErrorBoundaryState {
  hasError: boolean
}

export interface RenderSlide {
  itemIndex: number
  key: string
  logicalIndex: number
}

export interface InfiniteCarouselProps {
  items: CarouselItem[]
}

export interface CarouselStateProps {
  error: string | null
  onRetry: () => void
  status: 'loading' | 'error'
}

export interface CarouselItem {
  alt: string
  aspectRatio: number
  id: string
  src: string
  srcSet: string
}
