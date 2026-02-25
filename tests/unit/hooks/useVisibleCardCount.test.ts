import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { useVisibleCardCount } from '@/hooks/useVisibleCardCount'

const originalMatchMedia = window.matchMedia

function mockMatchMedia(extraMatches: Record<string, boolean> = {}) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: extraMatches[query] ?? false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: originalMatchMedia,
  })
})

describe('useVisibleCardCount', () => {
  test('returns default count (2) when no breakpoints match', () => {
    mockMatchMedia()
    const { result } = renderHook(() => useVisibleCardCount())
    expect(result.current).toBe(2)
  })

  test('returns 5 when desktop breakpoint matches', () => {
    mockMatchMedia({
      '(min-width: 1024px)': true,
      '(min-width: 640px)': true,
    })
    const { result } = renderHook(() => useVisibleCardCount())
    expect(result.current).toBe(5)
  })

  test('returns 3 when only tablet breakpoint matches', () => {
    mockMatchMedia({
      '(min-width: 1024px)': false,
      '(min-width: 640px)': true,
    })
    const { result } = renderHook(() => useVisibleCardCount())
    expect(result.current).toBe(3)
  })
})
