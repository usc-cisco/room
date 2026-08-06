import { describe, expect, test } from "bun:test"

import {
  FLOOR_CELLS,
  FLOOR_ROOMS,
  FLOOR_SPACES,
  GRID_COLUMNS,
  ROW_TRACKS,
} from "@/lib/floor-plan/data"

describe("floor plan data", () => {
  test("every space id is unique", () => {
    const ids = FLOOR_SPACES.map((space) => space.id)

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

  test("every selectable space carries a code or a name", () => {
    for (const room of FLOOR_ROOMS) {
      expect(Boolean(room.code ?? room.name), room.id).toBe(true)
    }
  })

  test("only stack cells have children", () => {
    for (const cell of FLOOR_CELLS) {
      if (cell.children) {
        expect(cell.kind).toBe("stack")
        expect(cell.children.length).toBeGreaterThan(0)
      } else {
        expect(cell.kind).not.toBe("stack")
      }
    }
  })

  test("stacked children are lifted into the flattened spaces", () => {
    const stacked = FLOOR_CELLS.flatMap((cell) => cell.children ?? [])
    const flatIds = new Set(FLOOR_SPACES.map((space) => space.id))

    expect(stacked.length).toBeGreaterThan(0)
    for (const child of stacked) {
      expect(flatIds.has(child.id)).toBe(true)
    }
  })
})
