import { describe, expect, test } from "bun:test"

import {
  CLASS_ROOMS,
  FLOOR_CELLS,
  GRID_COLUMNS,
  isClosed,
  NAMED_SPACES,
  PLATE_ASPECT,
  ROOM_STATUS_LABEL,
  ROW_TRACKS,
} from "@/lib/floor-plan/data"

describe("floor plan data", () => {
  test("every space id is unique", () => {
    const ids = FLOOR_CELLS.map((cell) => cell.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  test("no cell runs past the grid", () => {
    for (const cell of FLOOR_CELLS) {
      expect(cell.col).toBeGreaterThanOrEqual(1)
      expect(cell.col + cell.span - 1).toBeLessThanOrEqual(GRID_COLUMNS)
    }
  })

  test("no cell runs past the last row track", () => {
    for (const cell of FLOOR_CELLS) {
      expect(cell.row).toBeGreaterThanOrEqual(1)
      expect(cell.row + (cell.rowSpan ?? 1) - 1).toBeLessThanOrEqual(
        ROW_TRACKS.length
      )
    }
  })

  test("no two cells occupy the same grid square", () => {
    const occupied = new Map<string, string>()

    for (const cell of FLOOR_CELLS) {
      for (let row = cell.row; row < cell.row + (cell.rowSpan ?? 1); row++) {
        for (let col = cell.col; col < cell.col + cell.span; col++) {
          const key = `${row}:${col}`
          const holder = occupied.get(key)

          expect(
            holder,
            `${cell.id} overlaps ${holder} at row ${row}, column ${col}`
          ).toBeUndefined()

          occupied.set(key, cell.id)
        }
      }
    }
  })

  test("every named space carries a code or a name", () => {
    for (const space of NAMED_SPACES) {
      expect(Boolean(space.code ?? space.name), space.id).toBe(true)
    }
  })

  test("every class room has a code", () => {
    for (const room of CLASS_ROOMS) {
      expect(Boolean(room.code), room.id).toBe(true)
    }
  })

  // The plate's non-teaching spaces, pinned so that reclassifying one is a
  // deliberate edit rather than an accident.
  test("comfort rooms and facilities are not class rooms", () => {
    const classIds = new Set(CLASS_ROOMS.map((room) => room.id))

    for (const id of ["cr-a-west", "cr-a-east", "control", "department"]) {
      expect(classIds.has(id), id).toBe(false)
      expect(
        NAMED_SPACES.some((space) => space.id === id),
        id
      ).toBe(true)
    }
  })

  // The whole point of the plate is that one plan unit is the same size across
  // as it is down. That only holds while the pinned aspect ratio agrees with
  // the tracks, so pin the agreement rather than the numbers.
  test("the plate's aspect ratio matches its row tracks", () => {
    const depth = ROW_TRACKS.reduce(
      (total, track) => total + Number.parseFloat(track),
      0
    )

    expect(PLATE_ASPECT.height).toBe(depth)
    expect(PLATE_ASPECT.width / GRID_COLUMNS).toBe(37.5)
  })

  test("LB443 is closed for renovation", () => {
    const lb443 = CLASS_ROOMS.find((room) => room.id === "lb443")

    expect(lb443?.status).toBe("renovation")
    expect(lb443 && isClosed(lb443)).toBe(true)
  })

  test("a room without a status is open", () => {
    const lb442 = CLASS_ROOMS.find((room) => room.id === "lb442")

    expect(lb442 && isClosed(lb442)).toBe(false)
  })

  test("only teaching rooms carry a status, and every status has a label", () => {
    for (const cell of FLOOR_CELLS) {
      if (cell.status === undefined) continue

      expect(cell.kind, cell.id).toBe("room")
      expect(ROOM_STATUS_LABEL[cell.status], cell.id).toBeTruthy()
    }
  })

  test("LB400–LB402 are class rooms of equal depth", () => {
    const depth = (id: string) => {
      const cell = FLOOR_CELLS.find((candidate) => candidate.id === id)

      if (cell?.kind !== "room") throw new Error(`No class room ${id}`)

      return ROW_TRACKS.slice(cell.row - 1, cell.row - 1 + (cell.rowSpan ?? 1))
        .map((track) => Number.parseFloat(track))
        .reduce((total, track) => total + track, 0)
    }

    const depths = ["lb400", "lb401", "lb402"].map(depth)

    for (const value of depths) {
      expect(Math.abs(value - depths[0]) / depths[0]).toBeLessThan(0.01)
    }
  })
})
