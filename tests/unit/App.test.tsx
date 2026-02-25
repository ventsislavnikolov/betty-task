import { render, screen } from '@testing-library/react'
import { beforeEach, test, vi } from 'vitest'
import App from '@/App'
import { usePicsumImages } from '@/hooks/usePicsumImages'

vi.mock('@/hooks/usePicsumImages', () => ({
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
  render(<App />)
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

  render(<App />)

  expect(screen.getByText(/offline placeholder mode/i)).toBeInTheDocument()
})
