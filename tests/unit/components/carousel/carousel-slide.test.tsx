/* biome-ignore-all lint/performance/useTopLevelRegex: test assertions use inline regex for clarity */
import { fireEvent, render, screen } from '@testing-library/react'
import { CarouselSlide } from '@/components/carousel-slide'

test('renders fallback when image fails', () => {
  render(
    <CarouselSlide
      alt="Broken"
      eager={false}
      src="https://picsum.photos/id/1/1200/800"
      srcSet="https://bad.local/img-400.jpg 400w"
    />,
  )
  const img = screen.getByRole('img', { name: 'Broken' })
  fireEvent.error(img)
  expect(screen.getByText(/image unavailable/i)).toBeInTheDocument()
})

test('renders image src and sizes attributes', () => {
  render(
    <CarouselSlide
      alt="Photo"
      eager
      src="https://picsum.photos/id/1/1200/800"
      srcSet=""
    />,
  )

  const img = screen.getByRole('img', { name: 'Photo' })
  expect(img).toHaveAttribute('src')
  expect(img).toHaveAttribute(
    'sizes',
    '(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw',
  )
})

test('sets loading attribute based on eager prop', () => {
  const { rerender } = render(
    <CarouselSlide
      alt="Lazy"
      eager={false}
      src="https://picsum.photos/id/1/1200/800"
      srcSet=""
    />,
  )

  expect(screen.getByRole('img', { name: 'Lazy' })).toHaveAttribute(
    'loading',
    'lazy',
  )

  rerender(
    <CarouselSlide
      alt="Lazy"
      eager
      src="https://picsum.photos/id/1/1200/800"
      srcSet=""
    />,
  )

  expect(screen.getByRole('img', { name: 'Lazy' })).toHaveAttribute(
    'loading',
    'eager',
  )
})
