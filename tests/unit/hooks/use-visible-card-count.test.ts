import { act, renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { useVisibleCardCount } from '@/hooks/use-visible-card-count'

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

  test('hydrates without mismatch when client viewport differs from server', async () => {
    mockMatchMedia({
      '(min-width: 1024px)': true,
      '(min-width: 640px)': true,
    })

    const matchMediaDesktop = window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    })

    const html = renderToString(createElement(HydrationProbe))

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaDesktop,
    })

    const container = document.createElement('div')
    container.innerHTML = html
    const hydrationErrors: unknown[] = []

    let root = null as ReturnType<typeof hydrateRoot> | null
    await act(async () => {
      root = hydrateRoot(container, createElement(HydrationProbe), {
        onRecoverableError(error) {
          hydrationErrors.push(error)
        },
        onUncaughtError(error) {
          hydrationErrors.push(error)
        },
      })
      await Promise.resolve()
    })

    const mismatchLogged = hydrationErrors.some(
      (error) =>
        error instanceof Error &&
        error.message.includes("didn't match the client"),
    )

    expect(mismatchLogged).toBe(false)
    act(() => {
      root?.unmount()
    })
  })
})

function HydrationProbe() {
  const cardCount = useVisibleCardCount()

  return createElement('div', { 'data-count': cardCount }, cardCount)
}
