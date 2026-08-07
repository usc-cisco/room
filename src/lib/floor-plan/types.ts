/**
 * Kinds of space on the floor plate.
 *
 * - `room`     — a teaching room: named, searchable, and holds classes
 * - `comfort`  — a comfort room: named and searchable, never holds classes
 * - `facility` — a named non-teaching space such as the Control Room or the
 *                Department Office: searchable, but has no class schedule
 * - `corridor` — circulation space, drawn but not interactive
 * - `excluded` — floor area that is not part of the department
 * - `stack`    — a wrapper that divides its own cell into a vertical run of
 *                blocks, for wings that do not line up with the shared rows
 */
export type CellKind =
  "room" | "comfort" | "facility" | "corridor" | "excluded" | "stack"

/** What a block on the plate is, independent of where it sits. */
export interface FloorSpace {
  /** Stable key, also used as the selection id. */
  id: string
  /** Room code as posted on the door, e.g. `LB445`. */
  code?: string
  /** Human name, e.g. `Control Room`. */
  name?: string
  description?: string
  kind: CellKind
}

/** A block stacked inside a `stack` cell; it inherits its position. */
export type StackBlock = FloorSpace & {
  kind: "room" | "comfort" | "excluded"
}

/** A block placed directly on the shared grid. */
export interface FloorCell extends FloorSpace {
  /** 1-based grid column the cell starts on. */
  col: number
  /** How many columns the cell covers. */
  span: number
  /** 1-based row track the cell starts on. */
  row: number
  /** How many row tracks the cell covers. Defaults to 1. */
  rowSpan?: number
  /** Blocks stacked vertically inside this cell. Only `stack` cells use it. */
  children?: readonly StackBlock[]
}

/**
 * A space that carries a label, so it can be searched for and highlighted.
 * Wider than `ClassRoom`: a comfort room is worth finding on the map even
 * though it has no timetable.
 */
export type NamedSpace = FloorSpace & {
  kind: "room" | "comfort" | "facility"
}

/**
 * A room that holds classes, and so is the only kind that opens a schedule.
 * Comfort rooms and facilities are labels on the plate, not bookable spaces.
 */
export type ClassRoom = FloorSpace & { kind: "room" }
