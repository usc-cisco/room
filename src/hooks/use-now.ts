"use client"

import { useEffect, useState } from "react"

import { devNow } from "@/lib/schedules/clock"

/** How often the live clock is re-read. Anything time-sensitive in this app is
 * measured in minutes, so a minute is as fine as it needs to be. */
const TICK_MS = 60_000

/** Strict Mode invokes effects twice in development; this keeps the override
 * notice to one line per page load. */
let hasAnnouncedOverride = false

/**
 * The current moment, re-read every minute.
 *
 * Honours the `NEXT_PUBLIC_DEV_NOW` development override, in which case the
 * returned time is frozen and no timer runs — a clock that ticks away from the
 * moment under test is useless for checking, say, a class changeover.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => devNow() ?? new Date())

  useEffect(() => {
    const frozen = devNow()

    if (frozen) {
      // Silent unless the override is actually set. A frozen clock you have
      // forgotten about is a genuinely confusing thing to debug.
      if (!hasAnnouncedOverride) {
        hasAnnouncedOverride = true
        console.info(
          `[dev] Clock frozen at ${frozen.toString()} via NEXT_PUBLIC_DEV_NOW.`
        )
      }
      return
    }

    const timer = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  return now
}
