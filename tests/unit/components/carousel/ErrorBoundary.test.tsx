import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { CarouselErrorBoundary } from '@/components/CarouselErrorBoundary'

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test render error')
  }
  return <div>Child content</div>
}

test('renders children when no error occurs', () => {
  render(
    <CarouselErrorBoundary>
      <ThrowingChild shouldThrow={false} />
    </CarouselErrorBoundary>,
  )

  expect(screen.getByText('Child content')).toBeInTheDocument()
})

test('renders fallback UI when child throws', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  render(
    <CarouselErrorBoundary>
      <ThrowingChild shouldThrow />
    </CarouselErrorBoundary>,
  )

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()

  consoleSpy.mockRestore()
})

test('recovers when retry is clicked', async () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const user = userEvent.setup()

  const { rerender } = render(
    <CarouselErrorBoundary>
      <ThrowingChild shouldThrow />
    </CarouselErrorBoundary>,
  )

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

  rerender(
    <CarouselErrorBoundary>
      <ThrowingChild shouldThrow={false} />
    </CarouselErrorBoundary>,
  )

  await user.click(screen.getByRole('button', { name: /retry/i }))

  expect(screen.getByText('Child content')).toBeInTheDocument()

  consoleSpy.mockRestore()
})
