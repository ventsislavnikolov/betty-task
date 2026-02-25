/* biome-ignore-all lint/performance/useTopLevelRegex: test assertions use inline regex for clarity */
import { render, screen } from '@testing-library/react'
import { beforeEach, test, vi } from 'vitest'
import { CarouselPageClient } from '@/components/carousel-page-client'
import { usePicsumImages } from '@/hooks/use-picsum-images'

vi.mock('@/hooks/use-picsum-images', () => ({
  usePicsumImages: vi.fn(),
}))

const mockUsePicsumImages = vi.mocked(usePicsumImages)

beforeEach(() => {
  mockUsePicsumImages.mockReturnValue({
    status: 'success',
    items: [
      {
        id: 'item-1',
        src: 'https://picsum.photos/id/1/1200/800',
        srcSet:
          'https://picsum.photos/id/1/400/267 400w, https://picsum.photos/id/1/800/533 800w',
        alt: 'Photo 1',
        aspectRatio: 1.5,
      },
    ],
    error: null,
    retry: vi.fn(),
    isOfflineFallback: false,
  })
})

test('renders interview app heading', () => {
  render(
    <CarouselPageClient
      initialState={{
        error: null,
        isOfflineFallback: false,
        items: [],
        status: 'loading',
      }}
    />,
  )
  expect(
    screen.getByRole('heading', { name: /betty infinite carousel/i }),
  ).toBeInTheDocument()
})

test('renders offline fallback badge when offline placeholder mode is active', () => {
  mockUsePicsumImages.mockReturnValue({
    status: 'success',
    items: [
      {
        id: 'offline-0',
        src: '/offline-placeholder.svg',
        srcSet: '/offline-placeholder.svg 400w',
        alt: 'Offline placeholder image',
        aspectRatio: 16 / 9,
      },
    ],
    error: null,
    retry: vi.fn(),
    isOfflineFallback: true,
  })

  render(
    <CarouselPageClient
      initialState={{
        error: null,
        isOfflineFallback: false,
        items: [],
        status: 'loading',
      }}
    />,
  )

  expect(screen.getByText(/offline placeholder mode/i)).toBeInTheDocument()
})
