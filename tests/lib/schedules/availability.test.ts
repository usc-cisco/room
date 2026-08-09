import { describe, expect, test } from "bun:test"

import { roomAvailability } from "@/lib/schedules/availability"
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
    program: "CIS",
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
