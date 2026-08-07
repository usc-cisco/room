import type { ClassRoom, FloorCell, FloorSpace, NamedSpace } from "./types"

/**
 * The plate is laid out on a fixed 40-column grid so every band lines up on the
 * same vertical edges. Rooms in the main rows are 4 columns wide and comfort
 * rooms 2, which is what keeps the plan reading as one floor rather than a set
 * of unrelated rows.
 *
 * The main run stops at column 36, leaving the last four as open floor so the
 * east rooms stand off the wall instead of butting into it.
 */
export const GRID_COLUMNS = 40

/**
 * Explicit row tracks, north to south. Room bands are tall, corridors are thin
 * bars, and the two open tracks reproduce the unbuilt floor the plan shows
 * above and below the southern corridor.
 */
export const ROW_TRACKS = [
  "3.25rem", // 1  north rooms
  "3.25rem", // 2  north rooms, lower offset
  "1.25rem", // 3  corridor
  "1.25rem", // 4  open floor
  "4rem", // 5  row A
  "1.25rem", // 6  corridor
  "4rem", // 7  row B
  "1rem", // 8  open floor
  "1.25rem", // 9  corridor
  "1.25rem", // 10 open floor
  "4rem", // 11 south rooms
] as const

/** Corridors and the room bands they serve share this column run. */
const MAIN_COL = 9
const MAIN_SPAN = 28

/** Column `offset` steps east of the main run's west edge. Positions are given
 * relative to it so the whole run can be moved by editing `MAIN_COL` alone. */
const main = (offset: number) => MAIN_COL + offset

export const FLOOR_CELLS: readonly FloorCell[] = [
  // ── North rooms ────────────────────────────────────────────────────────
  { id: "lb442", code: "LB442", kind: "room", col: main(0), span: 5, row: 1 },
  { id: "lb443a", code: "LB443A", kind: "room", col: main(5), span: 5, row: 1 },
  // Starts where LB443A ends: the two are staggered by row, not overlapped.
  {
    id: "lb443b",
    code: "LB443B",
    kind: "room",
    col: main(10),
    span: 5,
    row: 2,
  },

  // The corridor is set off from row A by a band of open floor, the same way
  // the southern corridor stands off from the south rooms.
  {
    id: "corridor-north",
    kind: "corridor",
    col: MAIN_COL,
    span: MAIN_SPAN,
    row: 3,
  },

  // ── West wing ──────────────────────────────────────────────────────────
  // Four blocks divide one tall cell evenly. They do not align with the shared
  // row tracks, so they are stacked inside a single cell instead of placed.
  {
    id: "west-wing",
    kind: "stack",
    col: 1,
    span: 6,
    row: 3,
    rowSpan: 5,
    children: [
      { id: "lb400", code: "LB400", kind: "room" },
      { id: "lb401", code: "LB401", kind: "room" },
      { id: "lb402", code: "LB402", kind: "room" },
      { id: "west-excluded", kind: "excluded" },
    ],
  },

  // ── Row A ──────────────────────────────────────────────────────────────
  {
    id: "cr-a-west",
    name: "Comfort Room",
    kind: "comfort",
    col: main(0),
    span: 2,
    row: 5,
  },
  { id: "row-a-excluded", kind: "excluded", col: main(2), span: 4, row: 5 },
  {
    id: "control",
    name: "Control Room",
    kind: "facility",
    col: main(6),
    span: 4,
    row: 5,
  },
  { id: "lb445", code: "LB445", kind: "room", col: main(10), span: 4, row: 5 },
  { id: "lb446", code: "LB446", kind: "room", col: main(14), span: 4, row: 5 },
  { id: "lb447", code: "LB447", kind: "room", col: main(18), span: 4, row: 5 },
  { id: "lb448", code: "LB448", kind: "room", col: main(22), span: 4, row: 5 },
  {
    id: "cr-a-east",
    name: "Comfort Room",
    kind: "comfort",
    col: main(26),
    span: 2,
    row: 5,
  },

  {
    id: "corridor-middle",
    kind: "corridor",
    col: MAIN_COL,
    span: MAIN_SPAN,
    row: 6,
  },

  // ── Row B ──────────────────────────────────────────────────────────────
  // The office absorbs the two columns row B would otherwise fall short by, so
  // LB467–LB470 keep the width of every other room and LB470 lands flush with
  // the east wall, level with the comfort room in row A above it.
  {
    id: "cr-b-west",
    name: "Comfort Room",
    kind: "comfort",
    col: main(0),
    span: 2,
    row: 7,
  },
  {
    id: "department",
    name: "Department Office",
    kind: "facility",
    col: main(2),
    span: 10,
    row: 7,
  },
  { id: "lb467", code: "LB467", kind: "room", col: main(12), span: 4, row: 7 },
  { id: "lb468", code: "LB468", kind: "room", col: main(16), span: 4, row: 7 },
  { id: "lb469", code: "LB469", kind: "room", col: main(20), span: 4, row: 7 },
  { id: "lb470", code: "LB470", kind: "room", col: main(24), span: 4, row: 7 },

  {
    id: "corridor-south",
    kind: "corridor",
    col: MAIN_COL,
    span: MAIN_SPAN,
    row: 9,
  },

  // ── South rooms ────────────────────────────────────────────────────────
  { id: "south-excluded", kind: "excluded", col: main(0), span: 10, row: 11 },
  { id: "lb483", code: "LB483", kind: "room", col: main(10), span: 4, row: 11 },
  { id: "lb484", code: "LB484", kind: "room", col: main(14), span: 4, row: 11 },
  { id: "lb485", code: "LB485", kind: "room", col: main(18), span: 4, row: 11 },
  { id: "lb486", code: "LB486", kind: "room", col: main(22), span: 4, row: 11 },
  {
    id: "cr-b-east",
    name: "Comfort Room",
    kind: "comfort",
    col: main(26),
    span: 2,
    row: 11,
  },
]

/** Every space on the plate, with stacked children lifted alongside the cells. */
export const FLOOR_SPACES: readonly FloorSpace[] = FLOOR_CELLS.flatMap(
  (cell) => (cell.children ? [cell, ...cell.children] : [cell])
)

/** Every space carrying a label, so it can be searched for and highlighted. */
export const NAMED_SPACES: readonly NamedSpace[] = FLOOR_SPACES.filter(
  (space): space is NamedSpace =>
    space.kind === "room" ||
    space.kind === "comfort" ||
    space.kind === "facility"
)

/** Every room that holds classes — the only kind that opens a schedule. */
export const CLASS_ROOMS: readonly ClassRoom[] = FLOOR_SPACES.filter(
  (space): space is ClassRoom => space.kind === "room"
)
