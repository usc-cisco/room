import { describe, expect, test } from "bun:test"

import {
  freeWindows,
  roomAvailability,
  teachingDay,
  type TimeWindow,
} from "@/lib/schedules/availability"
import { toMinutes } from "@/lib/schedules/format"
import type { RoomSchedule } from "@/lib/schedules/types"

let nextId = 0
function meeting(
  dayOfWeek: number,
  startTime: string,
  endTime: string
): RoomSchedule {
  return {
    id: `s${nextId++}`,
    roomId: "lb445",
    courseCode: "CIS 1101",
    courseDescription: "PROGRAMMING I",
    group: "Group 1",
    dayOfWeek,
    startTime,
    endTime,
  }
}

const at = (time: string) => toMinutes(time)!

/** Monday: 07:30–09:00, then a gap, then 13:00–14:30. */
const MONDAY = [meeting(1, "07:30", "09:00"), meeting(1, "13:00", "14:30")]

describe("roomAvailability", () => {
  test("counts to the end of the class in session", () => {
    const availability = roomAvailability(MONDAY, 1, at("08:25"))

    expect(availability).toEqual({
      state: "in-use",
      minutesLeft: 35,
      changesAt: "09:00",
    })
  })

  test("merges back-to-back classes into one stretch", () => {
    // Nobody can use the room at 12:30, so the count runs to 15:00.
    const schedules = [
      meeting(1, "10:00", "12:30"),
      meeting(1, "12:30", "15:00"),
    ]

    expect(roomAvailability(schedules, 1, at("12:00"))).toEqual({
      state: "in-use",
      minutesLeft: 180,
      changesAt: "15:00",
    })
  })

  test("merges an overlapping class that runs later", () => {
    const schedules = [
      meeting(1, "10:00", "12:00"),
      meeting(1, "11:00", "13:00"),
    ]

    expect(roomAvailability(schedules, 1, at("10:30"))).toEqual({
      state: "in-use",
      minutesLeft: 150,
      changesAt: "13:00",
    })
  })

  test("does not merge across a real gap", () => {
    const availability = roomAvailability(MONDAY, 1, at("08:00"))

    expect(availability.changesAt).toBe("09:00")
  })

  test("counts to the first class of the day when free before it", () => {
    expect(roomAvailability(MONDAY, 1, at("07:00"))).toEqual({
      state: "free",
      minutesLeft: 30,
      changesAt: "07:30",
    })
  })

  test("counts to the next class when free between two", () => {
    expect(roomAvailability(MONDAY, 1, at("11:40"))).toEqual({
      state: "free",
      minutesLeft: 80,
      changesAt: "13:00",
    })
  })

  test("is free with nothing to count to after the last class", () => {
    expect(roomAvailability(MONDAY, 1, at("15:00"))).toEqual({
      state: "free",
      minutesLeft: null,
      changesAt: null,
    })
  })

  test("treats the closing minute as free", () => {
    // The window is half-open, so a class ending at 09:00 leaves the room free
    // at 09:00 rather than for a last zero-minute moment.
    expect(roomAvailability(MONDAY, 1, at("09:00")).state).toBe("free")
  })

  test("ignores classes on another weekday", () => {
    const schedules = [meeting(2, "07:30", "09:00")]

    expect(roomAvailability(schedules, 1, at("08:00"))).toEqual({
      state: "free",
      minutesLeft: null,
      changesAt: null,
    })
  })

  test("skips entries whose times cannot be read", () => {
    const schedules = [
      meeting(1, "7:30", "09:00"),
      meeting(1, "13:00", "14:30"),
    ]

    expect(roomAvailability(schedules, 1, at("08:00"))).toEqual({
      state: "free",
      minutesLeft: 300,
      changesAt: "13:00",
    })
  })

  test("skips an entry that does not run forwards", () => {
    const schedules = [meeting(1, "14:30", "13:00")]

    expect(roomAvailability(schedules, 1, at("14:00"))).toEqual({
      state: "free",
      minutesLeft: null,
      changesAt: null,
    })
  })

  test("is free for a room with no classes at all", () => {
    expect(roomAvailability([], 1, at("08:00"))).toEqual({
      state: "free",
      minutesLeft: null,
      changesAt: null,
    })
  })
})

/** The floor's Monday: 07:30 at the earliest, 17:30 at the latest. */
const DAY: TimeWindow = {
  start: at("07:30"),
  end: at("17:30"),
  startTime: "07:30",
  endTime: "17:30",
}

/** Just the bounds, which is all the free-window assertions care about. */
const bounds = (windows: TimeWindow[]) =>
  windows.map((window) => [window.startTime, window.endTime])

describe("teachingDay", () => {
  test("spans the earliest start to the latest end across rooms", () => {
    const day = teachingDay(
      {
        lb445: [meeting(1, "10:00", "12:30")],
        lb446: [meeting(1, "07:30", "09:00"), meeting(1, "15:00", "17:30")],
      },
      1
    )

    expect(day?.startTime).toBe("07:30")
    expect(day?.endTime).toBe("17:30")
  })

  test("ignores classes on another weekday", () => {
    const day = teachingDay(
      {
        lb445: [meeting(1, "10:00", "12:30")],
        lb446: [meeting(2, "07:30", "09:00")],
      },
      1
    )

    expect(day?.startTime).toBe("10:00")
    expect(day?.endTime).toBe("12:30")
  })

  test("is null on a day with nothing scheduled", () => {
    expect(teachingDay({ lb445: [meeting(1, "10:00", "12:30")] }, 5)).toBeNull()
  })

  test("is null for an empty map", () => {
    expect(teachingDay({}, 1)).toBeNull()
  })
})

describe("freeWindows", () => {
  test("returns the gaps around a room's classes", () => {
    // The room opens the day, so there is no window before its first class.
    expect(bounds(freeWindows(MONDAY, 1, DAY))).toEqual([
      ["09:00", "13:00"],
      ["14:30", "17:30"],
    ])
  })

  test("opens with a window when the room starts after the floor does", () => {
    const schedules = [meeting(1, "10:00", "12:30")]

    expect(bounds(freeWindows(schedules, 1, DAY))).toEqual([
      ["07:30", "10:00"],
      ["12:30", "17:30"],
    ])
  })

  test("leaves no window between back-to-back classes", () => {
    const schedules = [
      meeting(1, "10:00", "12:30"),
      meeting(1, "12:30", "15:00"),
    ]

    expect(bounds(freeWindows(schedules, 1, DAY))).toEqual([
      ["07:30", "10:00"],
      ["15:00", "17:30"],
    ])
  })

  test("merges overlapping classes before taking the complement", () => {
    const schedules = [
      meeting(1, "10:00", "12:00"),
      meeting(1, "11:00", "15:00"),
    ]

    expect(bounds(freeWindows(schedules, 1, DAY))).toEqual([
      ["07:30", "10:00"],
      ["15:00", "17:30"],
    ])
  })

  test("returns nothing for a room busy the whole day", () => {
    const schedules = [
      meeting(1, "07:30", "12:30"),
      meeting(1, "12:30", "17:30"),
    ]

    expect(freeWindows(schedules, 1, DAY)).toEqual([])
  })

  test("returns the whole day for a room with no classes", () => {
    expect(bounds(freeWindows([], 1, DAY))).toEqual([["07:30", "17:30"]])
  })

  test("returns the whole day when every class is on another weekday", () => {
    const schedules = [meeting(2, "10:00", "12:30")]

    expect(bounds(freeWindows(schedules, 1, DAY))).toEqual([["07:30", "17:30"]])
  })

  test("ignores a class that runs past the end of the day", () => {
    // The day is derived from the timetable, so this cannot happen with real
    // data — but a window clipped to the day is what callers render.
    const schedules = [meeting(1, "15:00", "23:00")]

    expect(bounds(freeWindows(schedules, 1, DAY))).toEqual([["07:30", "15:00"]])
  })
})
