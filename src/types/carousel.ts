export type CarouselSlideProps = {
  src: string
  srcSet: string
  alt: string
  eager: boolean
}

import type { ReactNode } from 'react'

export type CarouselErrorBoundaryProps = {
  children: ReactNode
}

export type CarouselErrorBoundaryState = {
  hasError: boolean
}

export type RenderSlide = {
  key: string
  logicalIndex: number
  itemIndex: number
}

export type InfiniteCarouselProps = {
  items: CarouselItem[]
}

export type CarouselStateProps = {
  status: 'loading' | 'error'
  error: string | null
  onRetry: () => void
}

export type CarouselItem = {
  id: string
  src: string
  srcSet: string
  alt: string
  aspectRatio: number
}
