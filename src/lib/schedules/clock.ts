/**
 * A development-only fixed clock.
 *
 * The room sheet is entirely driven by "now" — which day it lists, and which
 * class carries the `Now` marker — so being able to point the app at an
 * arbitrary moment is what makes those states reachable without waiting for
 * the right time of day.
 *
 * Client-safe on purpose: the clock is read inside a client component, so this
 * cannot live in `src/lib/env.ts`, which throws without the auth secrets and is
 * imported by the database client.
 */

/**
 * Reads an override value into a `Date`.
 *
 * Returns null for anything absent, blank or unparseable, so a typo falls back
 * to the real clock instead of rendering `Invalid Date` everywhere. Kept pure
 * and separate from the `process.env` read so it can be tested directly.
 *
 * A value with no timezone suffix is parsed as local time, which is what you
 * want against a timetable written in local wall-clock hours.
 */
export function parseDevNow(value: string | undefined | null): Date | null {
  const raw = value?.trim()
  if (!raw) return null

  const parsed = new Date(raw)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * The overridden moment, or null to use the real clock.
 *
 * Both `process.env` lookups are static literals so Next inlines them at build
 * time and the production bundle drops this branch entirely.
 */
export function devNow(): Date | null {
  if (process.env.NODE_ENV === "production") return null

  return parseDevNow(process.env.NEXT_PUBLIC_DEV_NOW)
}
