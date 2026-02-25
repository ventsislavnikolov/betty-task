import { useSyncExternalStore } from 'react'
import {
  CAROUSEL_BREAKPOINTS,
  CAROUSEL_DEFAULT_CARD_COUNT,
} from '@/lib/constants'

function getSnapshot(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return CAROUSEL_DEFAULT_CARD_COUNT

  for (const { query, cardCount } of CAROUSEL_BREAKPOINTS) {
    if (window.matchMedia(query).matches) return cardCount
  }
  return CAROUSEL_DEFAULT_CARD_COUNT
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
    return () => {}

  const mediaQueryLists = CAROUSEL_BREAKPOINTS.map(({ query }) =>
    window.matchMedia(query),
  )

  for (const mql of mediaQueryLists) {
    mql.addEventListener('change', onStoreChange)
  }

  return () => {
    for (const mql of mediaQueryLists) {
      mql.removeEventListener('change', onStoreChange)
    }
  }
}

export function useVisibleCardCount(): number {
  return useSyncExternalStore(subscribe, getSnapshot)
}
