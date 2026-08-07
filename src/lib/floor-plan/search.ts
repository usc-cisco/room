import { NAMED_SPACES } from "./data"
import type { ClassRoom, FloorSpace, NamedSpace } from "./types"

/**
 * Spaces carrying a label, so they can be found by search and highlighted.
 * Corridors and excluded floor area are drawn for orientation only.
 */
export function isNamedSpace(space: FloorSpace): space is NamedSpace {
  return (
    space.kind === "room" ||
    space.kind === "comfort" ||
    space.kind === "facility"
  )
}

/**
 * Rooms that hold classes, and so are the only ones that open a schedule.
 *
 * Comfort rooms, the Control Room and the Department Office are labels on the
 * plate: worth finding, but there is no timetable behind them, so opening one
 * would only ever show an empty sheet.
 */
export function isClassRoom(space: FloorSpace): space is ClassRoom {
  return space.kind === "room"
}

/**
 * Case-insensitive match against a space's code and name.
 *
 * An empty or whitespace-only query matches nothing, which is what lets the map
 * treat "no query" as "dim nothing" rather than "everything matches".
 */
export function matchesQuery(space: FloorSpace, query: string): boolean {
  const needle = query.trim().toLowerCase()

  if (!needle || !isNamedSpace(space)) {
    return false
  }

  const haystack = [space.code, space.name]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()

  return haystack.includes(needle)
}

/** Every labelled space matching the query, in plate order. */
export function findRooms(query: string): NamedSpace[] {
  return NAMED_SPACES.filter((space) => matchesQuery(space, query))
}
