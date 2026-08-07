import { GRID_COLUMNS, PLATE_ASPECT } from "./data"

/**
 * A block's rectangle on the landscape plate, as `FLOOR_CELLS` stores it.
 *
 * The primitives rather than a `FloorCell`, because the occupancy legend needs
 * placing the same way and is not a cell.
 */
export interface GridArea {
  col: number
  span: number
  row: number
  rowSpan?: number
}

/** A `grid-column` / `grid-row` pair, ready to hand to CSS. */
export interface Placement {
  column: string
  row: string
}

/** The plate as stored: the plan turned a quarter turn clockwise. */
export function landscapePlacement(area: GridArea): Placement {
  return {
    column: `${area.col} / span ${area.span}`,
    row: `${area.row} / span ${area.rowSpan ?? 1}`,
  }
}

/**
 * The same block with the plate turned back to the plan's own north-up
 * orientation — an exact transpose, not a redrawing.
 *
 * Landscape lays the plan's north–south axis across the plate and its east–west
 * axis down it. Portrait swaps them back, so a block's row track becomes its
 * column and vice versa. The column is additionally counted from the far end:
 * the landscape plate's west edge is the plan's *south*, which portrait draws at
 * the bottom, so the order along that axis reverses.
 */
export function portraitPlacement(area: GridArea): Placement {
  const lastColumn = area.col + area.span - 1

  return {
    column: `${area.row} / span ${area.rowSpan ?? 1}`,
    row: `${GRID_COLUMNS + 1 - lastColumn} / span ${area.span}`,
  }
}

/** `PLATE_ASPECT` on its side, since the transpose swaps the plate's axes too. */
export const PORTRAIT_ASPECT = {
  width: PLATE_ASPECT.height,
  height: PLATE_ASPECT.width,
}
