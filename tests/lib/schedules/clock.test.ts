import { describe, expect, test } from "bun:test"

import { parseDevNow } from "@/lib/schedules/clock"

describe("parseDevNow", () => {
  test("reads a date and time as local, not UTC", () => {
    const parsed = parseDevNow("2026-08-10T11:00")

    expect(parsed).not.toBeNull()
    expect(parsed!.getFullYear()).toBe(2026)
    expect(parsed!.getDay()).toBe(1) // Monday
    expect(parsed!.getHours()).toBe(11)
    expect(parsed!.getMinutes()).toBe(0)
  })

  test("accepts seconds", () => {
    const parsed = parseDevNow("2026-08-10T12:30:45")

    expect(parsed!.getHours()).toBe(12)
    expect(parsed!.getMinutes()).toBe(30)
  })

  test("accepts a date on its own", () => {
    const parsed = parseDevNow("2026-08-10")

    expect(parsed).not.toBeNull()
    expect(parsed!.getFullYear()).toBe(2026)
  })

  test("trims surrounding whitespace", () => {
    expect(parseDevNow("  2026-08-10T11:00  ")?.getHours()).toBe(11)
  })

  test("returns null when unset", () => {
    expect(parseDevNow(undefined)).toBeNull()
    expect(parseDevNow(null)).toBeNull()
  })

  test("returns null for a blank value", () => {
    expect(parseDevNow("")).toBeNull()
    expect(parseDevNow("   ")).toBeNull()
  })

  // A typo must fall back to the real clock rather than propagate an
  // `Invalid Date` into every day heading and time comparison.
  test("returns null for anything unparseable", () => {
    expect(parseDevNow("tomorrow")).toBeNull()
    expect(parseDevNow("2026-13-45")).toBeNull()
    expect(parseDevNow("not-a-date")).toBeNull()
  })
})
