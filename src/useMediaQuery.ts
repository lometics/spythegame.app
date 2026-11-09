import { useSyncExternalStore } from 'react'

/** Whether a CSS media query matches right now; follows changes. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Desktop layout breakpoint (Tailwind `lg`). */
export const DESKTOP = '(min-width: 1024px)'
