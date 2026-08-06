import { FLOOR_ROOMS } from "./data"
import type { FloorSpace, SelectableSpace } from "./types"

/** Spaces a person can search for and select. Corridors and excluded floor
 * area are drawn for orientation only. */
export function isSelectable(space: FloorSpace): space is SelectableSpace {
  return space.kind === "room" || space.kind === "comfort"
}

/**
 * Case-insensitive match against a space's code and name.
 *
 * An empty or whitespace-only query matches nothing, which is what lets the map
 * treat "no query" as "dim nothing" rather than "everything matches".
 */
export function matchesQuery(space: FloorSpace, query: string): boolean {
  const needle = query.trim().toLowerCase()

  if (!needle || !isSelectable(space)) {
    return false
  }

  const haystack = [space.code, space.name]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()

  return haystack.includes(needle)
}

/** Every selectable space matching the query, in plate order. */
export function findRooms(query: string): SelectableSpace[] {
  return FLOOR_ROOMS.filter((room) => matchesQuery(room, query))
}
