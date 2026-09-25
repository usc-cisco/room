import type {
  ClassRoom,
  FloorCell,
  FloorSpace,
  NamedSpace,
  RoomStatus,
} from "./types"

/**
 * The plate is traced off the posted evacuation plan, and every room size here
 * comes from measuring that drawing rather than from eyeballing a layout.
 *
 * Two conventions make the numbers below readable:
 *
 * 1. The map is the plan turned a quarter turn clockwise, so it reads landscape
 *    on a screen. The plan's three north–south wings become the map's three
 *    horizontal bands. Following from that, a wing's *north* end is the map's
 *    *right* edge.
 * 2. One grid column is 37.5 plan units, which is a quarter of a classroom.
 *    So a classroom is 4 columns, a half-room 2, and a comfort room 2.
 *
 * `ROW_TRACKS` needs no such conversion: the tracks are `fr` values in those
 * same plan units, so the two axes stay on one scale.
 */
export const GRID_COLUMNS = 32

/**
 * Row tracks, north to south. Rooms hold their measured depth on the plan; the
 * corridors and the open bands do not.
 *
 * The plan's courtyard is genuinely wider than a classroom, and at true size it
 * left a third of the map empty and pushed the wings too far apart to take in
 * at once. Compressing only what carries no room is what keeps every *room*
 * honest: the plate's height is compressed by the same amount (see
 * `PLATE_ASPECT`), so one plan unit stays the same size across as it is down.
 *
 * Corridors are all drawn one column wide — 37.5 units, against measured depths
 * of 49 to 54 — which is what lets the spines match them exactly, a spine being
 * a column rather than a track. Circulation then reads as one width everywhere
 * instead of four that differ by a hair, and the rooms it serves carry the
 * variation the plan actually has.
 */
export const ROW_TRACKS = [
  "117fr", //  1  LB442–LB443 block
  "37.5fr", // 2  its corridor
  "24fr", //   3  open floor, compressed
  "37.5fr", // 4  west wing corridor
  "118fr", //  5  west wing rooms
  "24fr", //   6  central open floor, compressed
  "112fr", //  7  middle wing rooms
  "37.5fr", // 8  its corridor
  "24fr", //   9  open floor, compressed
  "37.5fr", // 10 east wing corridor
  "114fr", //  11 east wing rooms
] as const

/**
 * The plate's proportions in plan units: 32 columns of 37.5 across, against the
 * summed row tracks down. Pinning it is what holds one unit to one size on both
 * axes, and so what keeps rooms to scale at every width rather than at one.
 */
export const PLATE_ASPECT = { width: GRID_COLUMNS * 37.5, height: 683 }

/** Where the wings' rooms start, east of the corridor spine that serves them. */
const RUN = 2

export const FLOOR_CELLS: readonly FloorCell[] = [
  // ── LB442–LB443 block ──────────────────────────────────────────────────
  // Detached from the rest of the floor, across the open ground. The plan draws
  // the two flush, so they share one row rather than staggering.
  { id: "lb442", code: "LB442", kind: "room", col: RUN, span: 4, row: 1 },
  {
    id: "lb443",
    code: "LB443",
    kind: "room",
    status: "renovation",
    col: RUN + 4,
    span: 4,
    row: 1,
  },
  // Serves the block and stops with it, at LB443's far wall.
  { id: "corridor-lb442s", kind: "corridor", col: RUN, span: 8, row: 2 },

  // ── West wing ──────────────────────────────────────────────────────────
  // Corridor on the outer face, then the rooms. Reading left to right is
  // reading the wing from its south end to its north end.
  { id: "corridor-west", kind: "corridor", col: RUN, span: 30, row: 4 },
  {
    id: "cr-a-west",
    name: "Comfort Room",
    kind: "comfort",
    col: RUN,
    span: 2,
    row: 5,
  },
  { id: "row-a-excluded", kind: "excluded", col: RUN + 2, span: 6, row: 5 },
  {
    id: "control",
    name: "Control Room",
    kind: "facility",
    col: RUN + 8,
    span: 4,
    row: 5,
  },
  { id: "lb445", code: "LB445", kind: "room", col: RUN + 12, span: 4, row: 5 },
  { id: "lb446", code: "LB446", kind: "room", col: RUN + 16, span: 4, row: 5 },
  { id: "lb447", code: "LB447", kind: "room", col: RUN + 20, span: 4, row: 5 },
  { id: "lb448", code: "LB448", kind: "room", col: RUN + 24, span: 4, row: 5 },
  {
    id: "cr-a-east",
    name: "Comfort Room",
    kind: "comfort",
    col: RUN + 28,
    span: 2,
    row: 5,
  },

  // ── Middle wing ────────────────────────────────────────────────────────
  {
    id: "cr-b-west",
    name: "Comfort Room",
    kind: "comfort",
    col: RUN,
    span: 2,
    row: 7,
  },
  {
    id: "department",
    name: "Department Office",
    kind: "facility",
    col: RUN + 2,
    span: 12,
    row: 7,
  },
  { id: "lb467", code: "LB467", kind: "room", col: RUN + 14, span: 4, row: 7 },
  { id: "lb468", code: "LB468", kind: "room", col: RUN + 18, span: 4, row: 7 },
  { id: "lb469", code: "LB469", kind: "room", col: RUN + 22, span: 4, row: 7 },
  { id: "lb470", code: "LB470", kind: "room", col: RUN + 26, span: 4, row: 7 },
  // This wing carries its corridor on the inner face, the opposite side from
  // the west wing, which is why the two corridor tracks sit either side of the
  // rooms rather than both above them.
  { id: "corridor-middle", kind: "corridor", col: RUN, span: 30, row: 8 },

  // ── East wing ──────────────────────────────────────────────────────────
  { id: "corridor-east", kind: "corridor", col: RUN, span: 30, row: 10 },
  { id: "south-excluded", kind: "excluded", col: RUN, span: 12, row: 11 },
  { id: "lb483", code: "LB483", kind: "room", col: RUN + 12, span: 4, row: 11 },
  { id: "lb484", code: "LB484", kind: "room", col: RUN + 16, span: 4, row: 11 },
  { id: "lb485", code: "LB485", kind: "room", col: RUN + 20, span: 4, row: 11 },
  { id: "lb486", code: "LB486", kind: "room", col: RUN + 24, span: 4, row: 11 },
  {
    id: "cr-b-east",
    name: "Comfort Room",
    kind: "comfort",
    col: RUN + 28,
    span: 2,
    row: 11,
  },

  // ── Circulation across the wings ───────────────────────────────────────
  // The two spines run the depth of the plate and are what tie the wings into
  // one floor: the south spine off the evacuation route along the plan's
  // bottom, the north spine off the one along its top.
  {
    id: "corridor-spine-south",
    kind: "corridor",
    col: 1,
    span: 1,
    row: 1,
    rowSpan: 11,
  },
  {
    id: "corridor-spine-north",
    kind: "corridor",
    col: 32,
    span: 1,
    row: 4,
    rowSpan: 8,
  },
]

/** Every space carrying a label, so it can be searched for and highlighted. */
export const NAMED_SPACES: readonly NamedSpace[] = FLOOR_CELLS.filter(
  (cell): cell is FloorCell & NamedSpace =>
    cell.kind === "room" || cell.kind === "comfort" || cell.kind === "facility"
)

/** Every room that holds classes — the only kind that opens a schedule. */
export const CLASS_ROOMS: readonly ClassRoom[] = FLOOR_CELLS.filter(
  (cell): cell is FloorCell & ClassRoom => cell.kind === "room"
)

/** How each out-of-service status reads to a person. */
export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  renovation: "Under renovation",
}

/** Whether a space is out of service and must never read as free. */
export function isClosed(space: FloorSpace): boolean {
  return space.status !== undefined
}
