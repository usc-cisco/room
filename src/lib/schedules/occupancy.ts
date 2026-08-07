import { isCurrent } from "./format"
import type { RoomScheduleMap } from "./types"

/**
 * The ids of rooms with a class in session at the given moment.
 *
 * A set rather than a list: the map asks "is this room busy" once per cell, and
 * that should not walk the timetable each time.
 *
 * Leans on `isCurrent`, whose window is half-open — start inclusive, end
 * exclusive — so a room stays continuously occupied across a changeover instead
 * of blinking at the shared minute.
 */
export function occupiedRoomIds(
  byRoom: RoomScheduleMap,
  dayOfWeek: number,
  minutes: number
): Set<string> {
  const occupied = new Set<string>()

  for (const [roomId, schedules] of Object.entries(byRoom)) {
    if (schedules.some((entry) => isCurrent(entry, dayOfWeek, minutes))) {
      occupied.add(roomId)
    }
  }

  return occupied
}
