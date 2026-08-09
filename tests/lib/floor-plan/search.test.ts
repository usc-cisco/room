import { describe, expect, test } from "bun:test"

import {
  findRooms,
  isClassRoom,
  isNamedSpace,
  matchesQuery,
} from "@/lib/floor-plan/search"
import type { FloorSpace } from "@/lib/floor-plan/types"

const room: FloorSpace = { id: "lb445", code: "LB445", kind: "room" }
const facility: FloorSpace = {
  id: "control",
  name: "Control Room",
  kind: "facility",
}
const comfort: FloorSpace = {
  id: "cr-a-west",
  name: "Comfort Room",
  kind: "comfort",
}
const corridor: FloorSpace = { id: "corridor-west", kind: "corridor" }
const excluded: FloorSpace = { id: "south-excluded", kind: "excluded" }

describe("isNamedSpace", () => {
  test("rooms, comfort rooms and facilities all carry labels", () => {
    expect(isNamedSpace(room)).toBe(true)
    expect(isNamedSpace(comfort)).toBe(true)
    expect(isNamedSpace(facility)).toBe(true)
  })

  test("corridors and excluded floor area do not", () => {
    expect(isNamedSpace(corridor)).toBe(false)
    expect(isNamedSpace(excluded)).toBe(false)
  })
})

describe("isClassRoom", () => {
  test("only teaching rooms hold classes", () => {
    expect(isClassRoom(room)).toBe(true)
  })

  test("comfort rooms and facilities do not", () => {
    expect(isClassRoom(comfort)).toBe(false)
    expect(isClassRoom(facility)).toBe(false)
  })

  test("neither do corridors or excluded floor area", () => {
    expect(isClassRoom(corridor)).toBe(false)
    expect(isClassRoom(excluded)).toBe(false)
  })
})

describe("matchesQuery", () => {
  test("matches a code case-insensitively", () => {
    expect(matchesQuery(room, "lb445")).toBe(true)
    expect(matchesQuery(room, "LB445")).toBe(true)
  })

  test("matches a partial code", () => {
    expect(matchesQuery(room, "445")).toBe(true)
  })

  test("matches a name", () => {
    expect(matchesQuery(facility, "control")).toBe(true)
    expect(matchesQuery(comfort, "comfort")).toBe(true)
  })

  test("ignores surrounding whitespace", () => {
    expect(matchesQuery(room, "  lb445  ")).toBe(true)
  })

  test("an empty or whitespace-only query matches nothing", () => {
    expect(matchesQuery(room, "")).toBe(false)
    expect(matchesQuery(room, "   ")).toBe(false)
  })

  test("never matches corridors or excluded floor area", () => {
    expect(matchesQuery(corridor, "corridor")).toBe(false)
    expect(matchesQuery(excluded, "excluded")).toBe(false)
  })

  test("returns false when nothing matches", () => {
    expect(matchesQuery(room, "zzz")).toBe(false)
  })
})

describe("findRooms", () => {
  test("finds a room on the real plate by code", () => {
    expect(findRooms("LB445").map((found) => found.id)).toEqual(["lb445"])
  })

  test("finds every room sharing a code prefix", () => {
    expect(findRooms("LB44").map((found) => found.code)).toEqual([
      "LB442",
      "LB443",
      "LB445",
      "LB446",
      "LB447",
      "LB448",
    ])
  })

  test("finds every comfort room by name", () => {
    const found = findRooms("comfort")

    expect(found.length).toBeGreaterThan(0)
    expect(found.every((space) => space.kind === "comfort")).toBe(true)
  })

  // Facilities never open a schedule, but they are still worth locating on
  // the plate, so search must keep reaching them.
  test("finds facilities by name", () => {
    expect(findRooms("control").map((found) => found.id)).toEqual(["control"])
    expect(findRooms("department office").map((found) => found.id)).toEqual([
      "department",
    ])
  })

  test("returns nothing for an empty query", () => {
    expect(findRooms("")).toEqual([])
  })

  test("returns nothing for an unknown code", () => {
    expect(findRooms("LB999")).toEqual([])
  })
})
