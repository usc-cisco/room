/** Indexed by `day_of_week`, 0 = Sunday through 6 = Saturday. */
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? "Unknown day"
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

/**
 * `Friday, August 7, 2026`.
 *
 * Spelled out rather than delegated to `toLocaleDateString` so the output is
 * identical everywhere — the server, the browser and the tests — instead of
 * shifting with whatever locale each happens to be running under.
 */
export function formatLongDate(date: Date): string {
  return `${dayName(date.getDay())}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/** A moment as a 12-hour wall-clock time, e.g. `1:55 PM`. */
export function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return formatTime(`${hours}:${minutes}`)
}

/**
 * Renders a stored `HH:MM` as a 12-hour time — the way the timetable itself is
 * written, and the way people read a class schedule. Storage stays 24-hour so
 * it keeps sorting correctly as plain text.
 *
 * Anything that is not `HH:MM` is passed through untouched rather than
 * mangled: showing the raw value makes bad data visible.
 */
export function formatTime(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})$/)
  if (!match) return value

  const hours = Number(match[1])
  const minutes = match[2]

  if (hours > 23) return value

  const meridiem = hours < 12 ? "AM" : "PM"
  const hour12 = hours % 12 === 0 ? 12 : hours % 12

  return `${hour12}:${minutes} ${meridiem}`
}

/** `07:30` and `09:00` as one readable range. */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

/**
 * A span of minutes as `45 min`, `1 hr` or `1 hr 25 min`.
 *
 * Spelled out rather than handed to `Intl.RelativeTimeFormat` for the same
 * reason `formatLongDate` is: one wording everywhere, instead of output that
 * shifts with whatever locale the server, the browser or a test is under.
 *
 * The unit stays singular at any count — `2 hr 5 min` — because this reads as a
 * measurement beside a clock rather than as a sentence.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "under a minute"

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} hr`

  return `${hours} hr ${rest} min`
}

/** `07:30` → minutes since midnight, or null if unparseable. */
export function toMinutes(value: string): number | null {
  const match = value.match(/^(\d{2}):(\d{2})$/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null

  return hours * 60 + minutes
}

interface Meeting {
  dayOfWeek: number
  startTime: string
  endTime: string
}

/**
 * Whether a meeting is in progress at the given moment.
 *
 * The clock is a parameter rather than read from `Date` so this stays pure and
 * testable. The window is half-open — start inclusive, end exclusive — so two
 * back-to-back classes never both report as current at the changeover minute.
 */
export function isCurrent(
  meeting: Meeting,
  dayOfWeek: number,
  minutesOfDay: number
): boolean {
  if (meeting.dayOfWeek !== dayOfWeek) return false

  const start = toMinutes(meeting.startTime)
  const end = toMinutes(meeting.endTime)
  if (start === null || end === null) return false

  return minutesOfDay >= start && minutesOfDay < end
}

/** Minutes since midnight for a moment, in the viewer's own timezone. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}
