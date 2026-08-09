/**
 * A budget per caller, held in this process's memory.
 *
 * In memory because the app is one Node process behind Apache: there is no
 * second instance to share counters with, and no case for running Redis to
 * protect a floor's timetable. The trade is stated rather than hidden — the
 * budgets reset when the process does, and a second instance would double them.
 */

/** How many calls a key may make, and over what stretch of time. */
export interface RateLimitRule {
  limit: number
  windowMs: number
}

export interface RateLimitDecision {
  ok: boolean
  /** Calls left in this window, after the one just counted. */
  remaining: number
  /** Seconds until the window rolls over. 0 while the caller is under budget. */
  retryAfter: number
}

interface Window {
  count: number
  resetAt: number
}

const MINUTE = 60_000

/** Reading the timetable: a page load. Generous — a person is clicking. */
export const PAGE_READS: RateLimitRule = { limit: 60, windowMs: MINUTE }

/** Anything that changes something, through `authedAction`. */
export const ACTIONS: RateLimitRule = { limit: 20, windowMs: MINUTE }

/**
 * Sweep expired entries once the map passes this size.
 *
 * A limiter keyed by caller is itself a memory vector: without a sweep, a
 * stream of distinct keys grows the heap until the process dies, which is the
 * thing the limiter exists to prevent. The threshold keeps the sweep off the
 * hot path — a floor's worth of users never reaches it.
 */
const SWEEP_AT = 1_000

const windows = new Map<string, Window>()

/**
 * Counts one call against `key` and says whether it is allowed.
 *
 * Fixed window rather than sliding: a burst straddling a boundary can take
 * roughly twice the budget for an instant, which is fine against what this
 * stops — runaway loops and scrapers — and a sliding log would cost memory per
 * request for precision nobody here needs. Please do not "fix" it into one.
 *
 * The clock is a parameter, as it is in `occupiedRoomIds` and
 * `roomAvailability`, so tests can step across a window instead of sleeping.
 */
export function rateLimit(
  key: string,
  rule: RateLimitRule,
  now: number = Date.now()
): RateLimitDecision {
  const current = windows.get(key)

  if (!current || now >= current.resetAt) {
    if (windows.size >= SWEEP_AT) sweep(now)

    windows.set(key, { count: 1, resetAt: now + rule.windowMs })

    return { ok: true, remaining: rule.limit - 1, retryAfter: 0 }
  }

  if (current.count >= rule.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1

  return {
    ok: true,
    remaining: rule.limit - current.count,
    retryAfter: 0,
  }
}

/** Drops windows that have already rolled over. */
function sweep(now: number): void {
  for (const [key, window] of windows) {
    if (now >= window.resetAt) windows.delete(key)
  }
}

/** How many keys are being tracked. For tests, and for a sanity check in a log. */
export function trackedKeys(): number {
  return windows.size
}

/** Forgets every budget. Tests only — nothing in the app should need this. */
export function resetRateLimits(): void {
  windows.clear()
}
