/* biome-ignore-all lint/performance/useTopLevelRegex: test assertions use inline regex for clarity */
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { InfiniteCarousel } from '@/components/infinite-carousel'

const singleItem = [
  {
    id: '1',
    src: 'https://picsum.photos/id/11/800/600',
    srcSet:
      'https://picsum.photos/id/11/400/300 400w, https://picsum.photos/id/11/800/600 800w',
    alt: 'Photo',
    aspectRatio: 4 / 3,
  },
]

describe('carousel accessibility', () => {
  test('exposes carousel semantics and slide labels', () => {
    render(<InfiniteCarousel items={singleItem} />)

    expect(
      screen.getByRole('region', { name: /image carousel/i }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('article', { name: /slide 1 of 1/i }),
    ).toHaveLength(3)
  })

  test('section has aria-roledescription="carousel"', () => {
    render(<InfiniteCarousel items={singleItem} />)

    const region = screen.getByRole('region', { name: /image carousel/i })
    expect(region).toHaveAttribute('aria-roledescription', 'carousel')
  })

  test('scroll track exists as carousel-track test id', () => {
    render(<InfiniteCarousel items={singleItem} />)

    const track = screen.getByTestId('carousel-track')
    expect(track).toBeInTheDocument()
  })
})
