import { toMinutes } from "./format"
import type { RoomSchedule } from "./types"

/** What a room is doing right now, and until when. */
export interface RoomAvailability {
  state: "in-use" | "free"
  /** Minutes until the state changes; null when nothing changes today. */
  minutesLeft: number | null
  /** Stored `HH:MM` the state changes at; null when nothing changes today. */
  changesAt: string | null
}

/** One meeting reduced to what this module reasons about. */
interface Window {
  start: number
  end: number
  /** The stored `HH:MM` behind each bound, so callers can format it as written. */
  startTime: string
  endTime: string
}

/**
 * How long a room stays as it is: in use until a class ends, or free until the
 * next one starts.
 *
 * The clock arrives as parameters rather than read from `Date`, so this stays
 * pure and testable — the same shape as `occupiedRoomIds`.
 *
 * Only today is considered. A room with nothing left on is free "for the rest
 * of the day" rather than counted through to tomorrow morning: the sheet lists
 * one day, and a duration that runs past the last row in view is a number
 * nobody can check.
 */
export function roomAvailability(
  schedules: readonly RoomSchedule[],
  dayOfWeek: number,
  minutes: number
): RoomAvailability {
  const today = windowsFor(schedules, dayOfWeek)

  // Half-open, matching `isCurrent`: start inclusive, end exclusive, so a class
  // that has just ended does not still count as in session.
  const current = today.find(
    (window) => window.start <= minutes && minutes < window.end
  )

  if (current) {
    const run = extend(current, today)

    return {
      state: "in-use",
      minutesLeft: run.end - minutes,
      changesAt: run.endTime,
    }
  }

  // Strictly after: a class starting on this very minute would be in session,
  // and so would have been found above.
  const next = today
    .filter((window) => window.start > minutes)
    .reduce<Window | null>(
      (earliest, window) =>
        earliest === null || window.start < earliest.start ? window : earliest,
      null
    )

  if (!next) return { state: "free", minutesLeft: null, changesAt: null }

  return {
    state: "free",
    minutesLeft: next.start - minutes,
    changesAt: next.startTime,
  }
}

/**
 * Today's meetings as windows, dropping any whose times do not parse or do not
 * run forwards.
 *
 * Skipping bad data rather than guessing at it matches `isCurrent`, which
 * refuses to call a meeting current when it cannot read its times.
 */
function windowsFor(
  schedules: readonly RoomSchedule[],
  dayOfWeek: number
): Window[] {
  const windows: Window[] = []

  for (const entry of schedules) {
    if (entry.dayOfWeek !== dayOfWeek) continue

    const start = toMinutes(entry.startTime)
    const end = toMinutes(entry.endTime)
    if (start === null || end === null || end <= start) continue

    windows.push({
      start,
      end,
      startTime: entry.startTime,
      endTime: entry.endTime,
    })
  }

  return windows
}

/**
 * Grows a window forward through every class that runs into it.
 *
 * Back-to-back classes are one stretch of occupancy, not two: there is no
 * minute between a 2:00 end and a 2:00 start when anyone could use the room, so
 * counting to the first class's end would promise a room that is not free.
 * Overlapping entries merge on the same rule.
 */
function extend(from: Window, windows: readonly Window[]): Window {
  let run = from
  let grew = true

  while (grew) {
    grew = false

    for (const window of windows) {
      if (window.start <= run.end && window.end > run.end) {
        run = window
        grew = true
      }
    }
  }

  return run
}
