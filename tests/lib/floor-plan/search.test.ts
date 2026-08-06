import { describe, expect, test } from "bun:test"

import { findRooms, isSelectable, matchesQuery } from "@/lib/floor-plan/search"
import type { FloorSpace } from "@/lib/floor-plan/types"

const room: FloorSpace = { id: "lb445", code: "LB445", kind: "room" }
const named: FloorSpace = { id: "control", name: "Control Room", kind: "room" }
const comfort: FloorSpace = {
  id: "cr-a-west",
  name: "Comfort Room",
  kind: "comfort",
}
const corridor: FloorSpace = { id: "corridor-north", kind: "corridor" }
const excluded: FloorSpace = { id: "south-excluded", kind: "excluded" }

describe("isSelectable", () => {
  test("rooms and comfort rooms are selectable", () => {
    expect(isSelectable(room)).toBe(true)
    expect(isSelectable(comfort)).toBe(true)
  })

  test("corridors and excluded floor area are not", () => {
    expect(isSelectable(corridor)).toBe(false)
    expect(isSelectable(excluded)).toBe(false)
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
    expect(matchesQuery(named, "control")).toBe(true)
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
    expect(findRooms("LB40").map((found) => found.code)).toEqual([
      "LB400",
      "LB401",
      "LB402",
    ])
  })

  test("finds every comfort room by name", () => {
    const found = findRooms("comfort")

    expect(found.length).toBeGreaterThan(0)
    expect(found.every((space) => space.kind === "comfort")).toBe(true)
  })

  test("returns nothing for an empty query", () => {
    expect(findRooms("")).toEqual([])
  })

  test("returns nothing for an unknown code", () => {
    expect(findRooms("LB999")).toEqual([])
  })
})
