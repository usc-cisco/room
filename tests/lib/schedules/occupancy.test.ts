import { describe, expect, test } from "bun:test"

import { toMinutes } from "@/lib/schedules/format"
import { occupiedRoomIds } from "@/lib/schedules/occupancy"
import type { RoomSchedule, RoomScheduleMap } from "@/lib/schedules/types"

let nextId = 0
function meeting(
  roomId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string
): RoomSchedule {
  return {
    id: `s${nextId++}`,
    roomId,
    courseCode: "CIS 1101",
    courseDescription: "PROGRAMMING I",
    group: "Group 1",
    program: "CIS",
    dayOfWeek,
    startTime,
    endTime,
  }
}

/** Monday: LB467 runs back-to-back, LB445 has a gap, LB446 is Tuesday only. */
const MONDAY: RoomScheduleMap = {
  lb467: [
    meeting("lb467", 1, "10:00", "12:30"),
    meeting("lb467", 1, "12:30", "15:00"),
  ],
  lb445: [
    meeting("lb445", 1, "07:30", "09:00"),
    meeting("lb445", 1, "13:00", "14:30"),
  ],
  lb446: [meeting("lb446", 2, "10:00", "12:30")],
}

const at = (time: string) => toMinutes(time)!

describe("occupiedRoomIds", () => {
  test("includes a room mid-class", () => {
    expect([...occupiedRoomIds(MONDAY, 1, at("11:00"))]).toEqual(["lb467"])
  })

  test("excludes a room between its classes", () => {
    const occupied = occupiedRoomIds(MONDAY, 1, at("12:00"))

    expect(occupied.has("lb445")).toBe(false)
  })

  test("stays occupied across a back-to-back changeover", () => {
    const occupied = occupiedRoomIds(MONDAY, 1, at("12:30"))

    // The 10:00 class has ended and the 12:30 one has begun, so the room is
    // continuously busy rather than blinking at the shared minute.
    expect(occupied.has("lb467")).toBe(true)
  })

  test("a room appears once however many classes it has", () => {
    expect(occupiedRoomIds(MONDAY, 1, at("12:30")).size).toBe(1)
  })

  test("ignores classes on another weekday at the same time", () => {
    const occupied = occupiedRoomIds(MONDAY, 1, at("11:00"))

    expect(occupied.has("lb446")).toBe(false)
    expect(occupiedRoomIds(MONDAY, 2, at("11:00")).has("lb446")).toBe(true)
  })

  test("is empty before the first class and after the last", () => {
    expect(occupiedRoomIds(MONDAY, 1, at("06:00")).size).toBe(0)
    expect(occupiedRoomIds(MONDAY, 1, at("23:00")).size).toBe(0)
  })

  test("is empty on a day with nothing scheduled", () => {
    expect(occupiedRoomIds(MONDAY, 5, at("11:00")).size).toBe(0)
  })

  test("is empty for an empty map", () => {
    expect(occupiedRoomIds({}, 1, at("11:00")).size).toBe(0)
  })

  test("reports rooms in session, not every room with a class that day", () => {
    const occupied = occupiedRoomIds(MONDAY, 1, at("08:00"))

    expect([...occupied]).toEqual(["lb445"])
  })
})
