import { describe, expect, test } from "bun:test"

import {
  dayName,
  formatClock,
  formatLongDate,
  formatTime,
  formatTimeRange,
  isCurrent,
  minutesOfDay,
  toMinutes,
} from "@/lib/schedules/format"

describe("dayName", () => {
  test("maps day_of_week values, 0 = Sunday", () => {
    expect(dayName(0)).toBe("Sunday")
    expect(dayName(1)).toBe("Monday")
    expect(dayName(6)).toBe("Saturday")
  })

  test("does not throw on an out-of-range value", () => {
    expect(dayName(7)).toBe("Unknown day")
  })
})

describe("formatTime", () => {
  test("renders morning times", () => {
    expect(formatTime("07:30")).toBe("7:30 AM")
    expect(formatTime("11:59")).toBe("11:59 AM")
  })

  test("renders afternoon times", () => {
    expect(formatTime("13:00")).toBe("1:00 PM")
    expect(formatTime("17:30")).toBe("5:30 PM")
    expect(formatTime("23:00")).toBe("11:00 PM")
  })

  test("handles the two noon/midnight edge cases", () => {
    expect(formatTime("00:00")).toBe("12:00 AM")
    expect(formatTime("00:30")).toBe("12:30 AM")
    expect(formatTime("12:00")).toBe("12:00 PM")
    expect(formatTime("12:30")).toBe("12:30 PM")
  })

  test("passes malformed values through rather than mangling them", () => {
    expect(formatTime("7:30")).toBe("7:30")
    expect(formatTime("24:00")).toBe("24:00")
    expect(formatTime("")).toBe("")
  })
})

describe("formatTimeRange", () => {
  test("joins both ends", () => {
    expect(formatTimeRange("07:30", "10:00")).toBe("7:30 AM – 10:00 AM")
    expect(formatTimeRange("10:00", "12:30")).toBe("10:00 AM – 12:30 PM")
  })
})

describe("toMinutes", () => {
  test("counts minutes since midnight", () => {
    expect(toMinutes("00:00")).toBe(0)
    expect(toMinutes("07:30")).toBe(450)
    expect(toMinutes("23:59")).toBe(1439)
  })

  test("rejects unparseable and impossible values", () => {
    expect(toMinutes("7:30")).toBeNull()
    expect(toMinutes("24:00")).toBeNull()
    expect(toMinutes("10:75")).toBeNull()
  })
})

describe("isCurrent", () => {
  const meeting = { dayOfWeek: 1, startTime: "10:00", endTime: "12:30" }

  test("is true partway through", () => {
    expect(isCurrent(meeting, 1, toMinutes("11:00")!)).toBe(true)
  })

  test("includes the start minute", () => {
    expect(isCurrent(meeting, 1, toMinutes("10:00")!)).toBe(true)
  })

  test("excludes the end minute, so back-to-back classes never overlap", () => {
    const next = { dayOfWeek: 1, startTime: "12:30", endTime: "15:00" }
    const at1230 = toMinutes("12:30")!

    expect(isCurrent(meeting, 1, at1230)).toBe(false)
    expect(isCurrent(next, 1, at1230)).toBe(true)
  })

  test("is false before and after", () => {
    expect(isCurrent(meeting, 1, toMinutes("09:59")!)).toBe(false)
    expect(isCurrent(meeting, 1, toMinutes("12:31")!)).toBe(false)
  })

  test("is false on a different day at the same time", () => {
    expect(isCurrent(meeting, 3, toMinutes("11:00")!)).toBe(false)
  })

  test("is false when the stored times are unparseable", () => {
    const broken = { dayOfWeek: 1, startTime: "oops", endTime: "12:30" }

    expect(isCurrent(broken, 1, 600)).toBe(false)
  })
})

describe("formatLongDate", () => {
  test("spells out the weekday and month", () => {
    expect(formatLongDate(new Date(2026, 7, 7))).toBe("Friday, August 7, 2026")
    expect(formatLongDate(new Date(2026, 0, 1))).toBe(
      "Thursday, January 1, 2026"
    )
  })

  test("does not zero-pad the day of the month", () => {
    expect(formatLongDate(new Date(2026, 11, 25))).toBe(
      "Friday, December 25, 2026"
    )
  })
})

describe("formatClock", () => {
  test("renders a moment as a 12-hour time", () => {
    expect(formatClock(new Date(2026, 7, 7, 13, 55))).toBe("1:55 PM")
    expect(formatClock(new Date(2026, 7, 7, 7, 5))).toBe("7:05 AM")
  })

  test("handles midnight and noon", () => {
    expect(formatClock(new Date(2026, 7, 7, 0, 0))).toBe("12:00 AM")
    expect(formatClock(new Date(2026, 7, 7, 12, 0))).toBe("12:00 PM")
  })
})

describe("minutesOfDay", () => {
  test("reads the local wall clock", () => {
    const date = new Date(2026, 7, 6, 14, 45)

    expect(minutesOfDay(date)).toBe(14 * 60 + 45)
  })
})
