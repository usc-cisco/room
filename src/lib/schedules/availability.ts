import { toMinutes } from "./format"
import type { RoomSchedule, RoomScheduleMap } from "./types"

/** What a room is doing right now, and until when. */
export interface RoomAvailability {
  state: "in-use" | "free"
  /** Minutes until the state changes; null when nothing changes today. */
  minutesLeft: number | null
  /** Stored `HH:MM` the state changes at; null when nothing changes today. */
  changesAt: string | null
}

/**
 * A stretch of the day, as minutes since midnight.
 *
 * Each bound also carries the stored `HH:MM` it came from, so a caller can print
 * a window with `formatTime` exactly as the timetable writes it, rather than
 * through a minutes-to-string formatter that would have to be kept in step.
 */
export interface TimeWindow {
  start: number
  end: number
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
  const busy = mergeWindows(windowsFor(schedules, dayOfWeek))

  // Half-open, matching `isCurrent`: start inclusive, end exclusive, so a class
  // that has just ended does not still count as in session.
  const current = busy.find((run) => run.start <= minutes && minutes < run.end)

  if (current) {
    return {
      state: "in-use",
      minutesLeft: current.end - minutes,
      changesAt: current.endTime,
    }
  }

  // Strictly after: a run starting on this very minute would be in session, and
  // so would have been found above.
  const next = busy.find((run) => run.start > minutes)

  if (!next) return { state: "free", minutesLeft: null, changesAt: null }

  return {
    state: "free",
    minutesLeft: next.start - minutes,
    changesAt: next.startTime,
  }
}

/**
 * The floor's teaching day: from the earliest class to start anywhere on it to
 * the latest to finish. Null when nothing is scheduled that day.
 *
 * Taken from the timetable rather than fixed office hours, so a free-time view
 * never offers a room at 3 AM and follows the data if the timetable moves.
 */
export function teachingDay(
  byRoom: RoomScheduleMap,
  dayOfWeek: number
): TimeWindow | null {
  let day: TimeWindow | null = null

  for (const schedules of Object.values(byRoom)) {
    for (const window of windowsFor(schedules, dayOfWeek)) {
      if (day === null) {
        day = window
        continue
      }

      day = {
        start: Math.min(day.start, window.start),
        end: Math.max(day.end, window.end),
        startTime: window.start < day.start ? window.startTime : day.startTime,
        endTime: window.end > day.end ? window.endTime : day.endTime,
      }
    }
  }

  return day
}

/**
 * The stretches a room is free inside the teaching day — the complement of its
 * classes.
 *
 * Runs are merged first, so back-to-back classes leave no zero-length gap to
 * offer someone. A room with nothing on comes back as the whole day; one busy
 * from open to close comes back empty.
 */
export function freeWindows(
  schedules: readonly RoomSchedule[],
  dayOfWeek: number,
  day: TimeWindow
): TimeWindow[] {
  const free: TimeWindow[] = []
  let cursor = day

  for (const busy of mergeWindows(windowsFor(schedules, dayOfWeek))) {
    if (busy.start >= cursor.end) break

    if (busy.start > cursor.start) {
      free.push({
        start: cursor.start,
        end: busy.start,
        startTime: cursor.startTime,
        endTime: busy.startTime,
      })
    }

    if (busy.end >= cursor.end) return free

    cursor = {
      start: busy.end,
      end: cursor.end,
      startTime: busy.endTime,
      endTime: cursor.endTime,
    }
  }

  if (cursor.start < cursor.end) free.push(cursor)

  return free
}

/**
 * Today's meetings as windows, in start order, dropping any whose times do not
 * parse or do not run forwards.
 *
 * Skipping bad data rather than guessing at it matches `isCurrent`, which
 * refuses to call a meeting current when it cannot read its times.
 */
function windowsFor(
  schedules: readonly RoomSchedule[],
  dayOfWeek: number
): TimeWindow[] {
  const windows: TimeWindow[] = []

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

  return windows.sort((a, b) => a.start - b.start)
}

/**
 * Windows that run into each other, joined into one.
 *
 * Back-to-back classes are one stretch of occupancy, not two: there is no
 * minute between a 2:00 end and a 2:00 start when anyone could use the room, so
 * treating them separately would both promise a room that is not free and cut
 * a countdown short. Overlapping entries join on the same rule.
 *
 * One implementation of that rule, so the room sheet's status band and the
 * free-rooms list cannot come to different answers.
 */
function mergeWindows(windows: readonly TimeWindow[]): TimeWindow[] {
  const merged: TimeWindow[] = []

  for (const window of windows) {
    const last = merged[merged.length - 1]

    if (last && window.start <= last.end) {
      if (window.end > last.end) {
        merged[merged.length - 1] = {
          ...last,
          end: window.end,
          endTime: window.endTime,
        }
      }
      continue
    }

    merged.push(window)
  }

  return merged
}
