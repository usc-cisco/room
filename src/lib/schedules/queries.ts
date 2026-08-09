// The marker rather than a comment saying the same: this module holds the
// database client, so a client component importing it fails the build instead
// of pulling better-sqlite3 into the browser. Client components take the shapes
// from `./types`, which is free of both.
import "server-only"

import { asc } from "drizzle-orm"

import { db } from "@/db"
import { schedule } from "@/db/schema"
import { requireSession } from "@/lib/auth/session"

import type { RoomSchedule, RoomScheduleMap } from "./types"

/**
 * Every meeting on the floor, in start order.
 *
 * The whole table is read at once rather than queried per room: it holds a
 * couple of hundred rows for a single floor, so handing it to the client makes
 * opening a room instant and costs no request per click. Every day is included
 * so the client can decide what "today" is in the viewer's own timezone.
 *
 * Synchronous because the better-sqlite3 driver is.
 *
 * Unexported on purpose: this reads the table with nothing checked, so the only
 * way out of this module is the gated function below. Exporting it would make
 * the gate optional.
 */
function listSchedules(): RoomSchedule[] {
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
function groupByRoom(schedules: readonly RoomSchedule[]): RoomScheduleMap {
  const byRoom: RoomScheduleMap = {}

  for (const entry of schedules) {
    byRoom[entry.roomId] ??= []
    byRoom[entry.roomId].push(entry)
  }

  return byRoom
}

/**
 * Every meeting on the floor, grouped by room, ready to hand to the map.
 *
 * The timetable is not public: who teaches what, where and when is a picture of
 * the department's week. The session is resolved here rather than by the caller
 * so that a page, a route handler or an action written later cannot read it by
 * forgetting to ask.
 */
export async function listSchedulesByRoom(): Promise<RoomScheduleMap> {
  await requireSession()

  return groupByRoom(listSchedules())
}
