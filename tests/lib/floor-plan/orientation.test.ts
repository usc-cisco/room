import { describe, expect, test } from "bun:test"

import { FLOOR_CELLS, GRID_COLUMNS, ROW_TRACKS } from "@/lib/floor-plan/data"
import {
  landscapePlacement,
  portraitPlacement,
  PORTRAIT_ASPECT,
} from "@/lib/floor-plan/orientation"

/** Reads the leading track number out of a `start / span n` value. */
const start = (value: string) => Number.parseInt(value, 10)

/** Reads the span out of a `start / span n` value. */
const span = (value: string) => Number.parseInt(value.split("span")[1], 10)

const cell = (id: string) => {
  const found = FLOOR_CELLS.find((candidate) => candidate.id === id)

  if (!found) throw new Error(`No cell ${id} on the plate`)

  return found
}

describe("landscapePlacement", () => {
  test("places a block where the plate stores it", () => {
    expect(landscapePlacement({ col: 31, span: 4, row: 5 })).toEqual({
      column: "31 / span 4",
      row: "5 / span 1",
    })
  })

  test("carries a multi-track row span through", () => {
    expect(landscapePlacement({ col: 1, span: 4, row: 4, rowSpan: 5 })).toEqual(
      {
        column: "1 / span 4",
        row: "4 / span 5",
      }
    )
  })
})

describe("portraitPlacement", () => {
  // LB448 is the northernmost classroom of the west wing, so turning the plate
  // north-up must move it to the wing's column and near the top.
  test("turns a west wing room onto the wing's column", () => {
    expect(portraitPlacement(cell("lb448"))).toEqual({
      column: "5 / span 1",
      row: "5 / span 4",
    })
  })

  // The plan's northern corridor: a bar along the top, reaching from the west
  // wing's corridor across to the east wing's rooms.
  test("lays the north spine along the top", () => {
    const placed = portraitPlacement(cell("corridor-spine-north"))

    expect(placed).toEqual({ column: "4 / span 8", row: "1 / span 2" })
  })

  // The south wing runs along the bottom of the plan, which is what the stack
  // has to become once the plate is turned back.
  test("lays the south wing along the bottom", () => {
    expect(portraitPlacement(cell("west-wing"))).toEqual({
      column: "4 / span 5",
      row: "35 / span 4",
    })
  })

  // LB445 is south of LB448 on the plan, so portrait must draw it lower.
  test("keeps the plan's north-to-south order down the plate", () => {
    const north = start(portraitPlacement(cell("lb448")).row)
    const south = start(portraitPlacement(cell("lb445")).row)

    expect(south).toBeGreaterThan(north)
  })

  test("every block lands inside the turned plate", () => {
    for (const block of FLOOR_CELLS) {
      const { column, row } = portraitPlacement(block)

      expect(start(column), block.id).toBeGreaterThanOrEqual(1)
      expect(start(column) + span(column) - 1, block.id).toBeLessThanOrEqual(
        ROW_TRACKS.length
      )
      expect(start(row), block.id).toBeGreaterThanOrEqual(1)
      expect(start(row) + span(row) - 1, block.id).toBeLessThanOrEqual(
        GRID_COLUMNS
      )
    }
  })

  // A transpose is a bijection, so this follows from the landscape plate being
  // free of overlaps — but it is cheap, and it catches a typo in the formula
  // that the bounds check above would let through.
  test("no two blocks overlap once the plate is turned", () => {
    const taken = new Map<string, string>()

    for (const block of FLOOR_CELLS) {
      const { column, row } = portraitPlacement(block)

      for (let c = start(column); c < start(column) + span(column); c++) {
        for (let r = start(row); r < start(row) + span(row); r++) {
          const key = `${c}:${r}`
          const holder = taken.get(key)

          expect(
            holder,
            `${block.id} overlaps ${holder} at column ${c}, row ${r}`
          ).toBeUndefined()

          taken.set(key, block.id)
        }
      }
    }
  })
})

describe("PORTRAIT_ASPECT", () => {
  // Turning the plate must not stretch it, or the rooms stop being to scale.
  test("is the plate's aspect on its side", () => {
    expect(PORTRAIT_ASPECT.width).toBe(816)
    expect(PORTRAIT_ASPECT.height).toBe(GRID_COLUMNS * 37.5)
  })
})
