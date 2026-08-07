"use client"

import { useNow } from "@/hooks/use-now"
import { devNow } from "@/lib/schedules/clock"
import { formatClock, formatLongDate } from "@/lib/schedules/format"

/**
 * The page heading: what time it is, and what day.
 *
 * The map answers "which room is free right now", so the moment being asked
 * about belongs on screen rather than left implicit.
 *
 * `suppressHydrationWarning` covers the one render where the server's clock and
 * the browser's can legitimately disagree. React sorts it out on hydration, and
 * the alternative — holding the heading blank until mount — trades a wrong
 * millisecond for a visible layout shift on every load.
 */
export function CurrentTime() {
  const now = useNow()
  const frozen = devNow() !== null

  return (
    <header className="grid gap-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1
          suppressHydrationWarning
          className="font-mono text-2xl font-medium tabular-nums"
        >
          {formatClock(now)}
        </h1>

        {frozen ? (
          <span className="bg-destructive/10 px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-destructive uppercase">
            Clock frozen
          </span>
        ) : null}
      </div>

      <p suppressHydrationWarning className="text-xs text-muted-foreground">
        {formatLongDate(now)}
      </p>
    </header>
  )
}
