import { asc } from "drizzle-orm"

import { db } from "@/db"
import { schedule } from "@/db/schema"

import type { RoomSchedule, RoomScheduleMap } from "./types"

/**
 * Server-only: this module imports the database client, so importing any value
 * from it inside a client component would pull better-sqlite3 into the browser
 * bundle. Client components take the shapes from `./types` instead.
 */

/**
 * Every meeting on the floor, in start order.
 *
 * The whole table is read at once rather than queried per room: it holds a
 * couple of hundred rows for a single floor, so handing it to the client makes
 * opening a room instant and costs no request per click. Every day is included
 * so the client can decide what "today" is in the viewer's own timezone.
 *
 * Synchronous because the better-sqlite3 driver is.
 */
export function listSchedules(): RoomSchedule[] {
  return db
    .select({
      id: schedule.id,
      roomId: schedule.roomId,
      courseCode: schedule.courseCode,
      courseDescription: schedule.courseDescription,
      group: schedule.group,
      program: schedule.program,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    })
    .from(schedule)
    .orderBy(asc(schedule.startTime), asc(schedule.endTime))
    .all()
}

/** Keys meetings by room id so the sheet can look one up without scanning. */
export function groupByRoom(
  schedules: readonly RoomSchedule[]
): RoomScheduleMap {
  const byRoom: RoomScheduleMap = {}

  for (const entry of schedules) {
    byRoom[entry.roomId] ??= []
    byRoom[entry.roomId].push(entry)
  }

  return byRoom
}

/** Every meeting on the floor, grouped by room, ready to hand to the map. */
export function listSchedulesByRoom(): RoomScheduleMap {
  return groupByRoom(listSchedules())
}
