"use client"

import { useSyncExternalStore } from "react"

/** Nothing ever changes, so the store never notifies. Module-level so the
 * reference is stable and React does not resubscribe on every render. */
const subscribe = () => () => {}
const onClient = () => true
const onServer = () => false

/**
 * `false` during the server render and the first client render, `true` from
 * hydration onward.
 *
 * The way to defer anything whose value the server cannot know — a clock, a
 * viewport size — until the markup has settled, without risking a mismatch.
 * `useSyncExternalStore` is React's own answer to this, and unlike a
 * `useState` + `useEffect` pair it does not set state during an effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, onClient, onServer)
}
