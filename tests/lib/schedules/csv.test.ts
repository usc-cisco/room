import { describe, expect, test } from "bun:test"

import {
  REQUIRED_COLUMNS,
  findMissingColumns,
  parseDayOfWeek,
  parseScheduleRow,
  parseTime,
  resolveRoomId,
} from "@/lib/schedules/csv"

const HEADERS = [
  "room_id",
  "course_code",
  "course_description",
  "group",
  "day_of_week",
  "start_time",
  "end_time",
]

describe("findMissingColumns", () => {
  test("accepts the exact required columns", () => {
    expect(findMissingColumns(HEADERS)).toEqual([])
  })

  test("REQUIRED_COLUMNS is the contract the parser reads", () => {
    expect([...REQUIRED_COLUMNS]).toEqual(HEADERS)
  })

  test("ignores extra columns", () => {
    expect(findMissingColumns([...HEADERS, "semester", "notes"])).toEqual([])
  })

  test("tolerates whitespace around a header", () => {
    expect(findMissingColumns(HEADERS.map((h) => ` ${h} `))).toEqual([])
  })

  test("rejects casing variants", () => {
    expect(findMissingColumns(["Room_ID", ...HEADERS.slice(1)])).toEqual([
      "room_id",
    ])
  })

  test("rejects camelCase and other spellings", () => {
    const missing = findMissingColumns(["roomId", "Course Code", "section"])

    expect(missing).toContain("room_id")
    expect(missing).toContain("course_code")
    expect(missing).toContain("group")
  })

  test("reports every missing column at once, in order", () => {
    expect(findMissingColumns(["room_id", "day_of_week"])).toEqual([
      "course_code",
      "course_description",
      "group",
      "start_time",
      "end_time",
    ])
  })
})

describe("parseDayOfWeek", () => {
  test("accepts digits 0 through 6", () => {
    expect(parseDayOfWeek("0")).toBe(0)
    expect(parseDayOfWeek("3")).toBe(3)
    expect(parseDayOfWeek("6")).toBe(6)
  })

  test("tolerates surrounding whitespace", () => {
    expect(parseDayOfWeek(" 2 ")).toBe(2)
  })

  test("rejects day names in every spelling", () => {
    expect(parseDayOfWeek("Monday")).toBeNull()
    expect(parseDayOfWeek("mon")).toBeNull()
    expect(parseDayOfWeek("THURS")).toBeNull()
  })

  test("rejects out-of-range and nonsense", () => {
    expect(parseDayOfWeek("7")).toBeNull()
    expect(parseDayOfWeek("-1")).toBeNull()
    expect(parseDayOfWeek("00")).toBeNull()
    expect(parseDayOfWeek("")).toBeNull()
    expect(parseDayOfWeek("someday")).toBeNull()
  })
})

describe("parseTime", () => {
  test("zero-pads 24-hour times", () => {
    expect(parseTime("8:00")).toBe("08:00")
    expect(parseTime("13:45")).toBe("13:45")
  })

  test("converts 12-hour times", () => {
    expect(parseTime("7:30 AM")).toBe("07:30")
    expect(parseTime("1:00 pm")).toBe("13:00")
    expect(parseTime("12:00 AM")).toBe("00:00")
    expect(parseTime("12:30 PM")).toBe("12:30")
  })

  test("rejects impossible times", () => {
    expect(parseTime("24:00")).toBeNull()
    expect(parseTime("10:75")).toBeNull()
    expect(parseTime("13:00 PM")).toBeNull()
    expect(parseTime("noon")).toBeNull()
  })
})

describe("resolveRoomId", () => {
  test("accepts the floor-plan id or the room code", () => {
    expect(resolveRoomId("lb445")).toBe("lb445")
    expect(resolveRoomId("LB445")).toBe("lb445")
  })

  test("rejects rooms that are not on the plan", () => {
    expect(resolveRoomId("LB999")).toBeNull()
    expect(resolveRoomId("")).toBeNull()
  })

  // Classes are only ever held in teaching rooms, so naming one of the
  // plate's other labelled spaces is an error the ingest should surface.
  test("rejects spaces that do not hold classes", () => {
    expect(resolveRoomId("control")).toBeNull()
    expect(resolveRoomId("department")).toBeNull()
    expect(resolveRoomId("cr-a-west")).toBeNull()
  })
})

describe("parseScheduleRow", () => {
  const valid = {
    room_id: "LB445",
    course_code: "IT321",
    course_description: "Networking 1",
    group: "G1",
    day_of_week: "1",
    start_time: "7:30 AM",
    end_time: "9:00 AM",
  }

  test("normalises a valid row", () => {
    const result = parseScheduleRow(valid)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({
      roomId: "lb445",
      courseCode: "IT321",
      courseDescription: "Networking 1",
      group: "G1",
      dayOfWeek: 1,
      startTime: "07:30",
      endTime: "09:00",
    })
  })

  test("rejects an end time that is not after the start", () => {
    const result = parseScheduleRow({ ...valid, end_time: "7:00 AM" })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.join()).toContain("not after start_time")
  })

  test("reports every problem in a row at once", () => {
    const result = parseScheduleRow({
      ...valid,
      room_id: "LB999",
      day_of_week: "someday",
      group: "",
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(3)
  })

  test("rejects a day name and says what it expected", () => {
    const result = parseScheduleRow({ ...valid, day_of_week: "Monday" })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual([
      'invalid day_of_week "Monday" (expected 0-6, Sunday to Saturday)',
    ])
  })

  test("names columns the way the CSV spells them", () => {
    const result = parseScheduleRow({ ...valid, course_code: "" })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toEqual(["course_code is empty"])
  })

  test("treats an absent column as an empty value rather than throwing", () => {
    expect(parseScheduleRow({}).ok).toBe(false)
  })
})
