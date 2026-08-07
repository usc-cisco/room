import { FLOOR_ROOMS } from "@/lib/floor-plan/data"

/** A validated row, shaped for insertion into the `schedule` table. */
export interface ScheduleInput {
  roomId: string
  courseCode: string
  courseDescription: string
  group: string
  program: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export type ParseResult =
  { ok: true; value: ScheduleInput } | { ok: false; errors: string[] }

/**
 * The one accepted spelling of each column: the table's own column names,
 * matched exactly. No synonyms and no case folding — a header that is nearly
 * right is reported as missing rather than guessed at, so a typo can never
 * silently load a column of empty strings.
 */
export const CSV_COLUMNS = {
  roomId: "room_id",
  courseCode: "course_code",
  courseDescription: "course_description",
  group: "group",
  program: "program",
  dayOfWeek: "day_of_week",
  startTime: "start_time",
  endTime: "end_time",
} as const satisfies Record<keyof ScheduleInput, string>

/** Every column a schedule CSV must carry, in the order they should appear. */
export const REQUIRED_COLUMNS: readonly string[] = Object.values(CSV_COLUMNS)

/**
 * Required columns absent from a header row, in declaration order. Extra
 * columns are ignored, so an export can carry fields we do not use.
 */
export function findMissingColumns(headers: readonly string[]): string[] {
  const present = new Set(headers.map((header) => header.trim()))

  return REQUIRED_COLUMNS.filter((column) => !present.has(column))
}

/**
 * The one accepted form: a single digit `0`–`6`, Sunday through Saturday, the
 * same encoding the `day_of_week` column stores. Day names are not accepted —
 * `Tue`, `Tues` and `Thur` are exactly the kind of near-miss spellings that
 * make a "helpful" parser start guessing.
 */
export function parseDayOfWeek(value: string): number | null {
  const raw = value.trim()

  return /^[0-6]$/.test(raw) ? Number(raw) : null
}

/**
 * Accepts 24-hour `H:MM`/`HH:MM` or 12-hour `H:MM AM`, and always returns
 * zero-padded 24-hour `HH:MM` — the only form the table's CHECK constraints
 * allow, and the form that sorts correctly as text.
 */
export function parseTime(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?$/i)
  if (!match) return null

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]?.toLowerCase().replace(/\./g, "")

  if (minutes > 59) return null

  if (meridiem) {
    if (hours < 1 || hours > 12) return null
    if (meridiem === "am") hours = hours === 12 ? 0 : hours
    else hours = hours === 12 ? 12 : hours + 12
  } else if (hours > 23) {
    return null
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

/**
 * Resolves a room reference to a floor-plan space id, accepting either the id
 * (`lb445`) or the code shown on the map (`LB445`). Returns null when the room
 * is not on the plan — the database cannot catch this, since rooms are static
 * data rather than a table.
 */
export function resolveRoomId(value: string): string | null {
  const raw = value.trim().toLowerCase()
  if (!raw) return null

  const room = FLOOR_ROOMS.find(
    (candidate) =>
      candidate.id.toLowerCase() === raw ||
      candidate.code?.toLowerCase() === raw
  )

  return room?.id ?? null
}

/** Validates one CSV record, collecting every problem rather than the first. */
export function parseScheduleRow(record: Record<string, string>): ParseResult {
  const errors: string[] = []
  const read = (field: keyof ScheduleInput) =>
    (record[CSV_COLUMNS[field]] ?? "").trim()

  const roomId = resolveRoomId(read("roomId"))
  if (!roomId) {
    errors.push(`unknown room ${JSON.stringify(read("roomId"))}`)
  }

  const text: Partial<Record<keyof ScheduleInput, string>> = {}
  for (const field of [
    "courseCode",
    "courseDescription",
    "group",
    "program",
  ] as const) {
    const value = read(field)
    if (!value) errors.push(`${CSV_COLUMNS[field]} is empty`)
    text[field] = value
  }

  const dayOfWeek = parseDayOfWeek(read("dayOfWeek"))
  if (dayOfWeek === null) {
    errors.push(
      `invalid day_of_week ${JSON.stringify(read("dayOfWeek"))} ` +
        `(expected 0-6, Sunday to Saturday)`
    )
  }

  const startTime = parseTime(read("startTime"))
  if (!startTime) {
    errors.push(`invalid start_time ${JSON.stringify(read("startTime"))}`)
  }

  const endTime = parseTime(read("endTime"))
  if (!endTime) {
    errors.push(`invalid end_time ${JSON.stringify(read("endTime"))}`)
  }

  if (startTime && endTime && endTime <= startTime) {
    errors.push(`end_time ${endTime} is not after start_time ${startTime}`)
  }

  if (errors.length) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      roomId: roomId!,
      courseCode: text.courseCode!,
      courseDescription: text.courseDescription!,
      group: text.group!,
      program: text.program!,
      dayOfWeek: dayOfWeek!,
      startTime: startTime!,
      endTime: endTime!,
    },
  }
}
