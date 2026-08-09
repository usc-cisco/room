/**
 * One weekly class meeting, as the map needs it.
 *
 * Lives apart from `queries.ts` on purpose: that module imports the database
 * client, and a client component that imports any *value* from it would drag
 * better-sqlite3 into the browser bundle. Importing the shape from here keeps
 * the client free of that edge — `import type` is erased at compile time.
 *
 * `createdAt` is omitted: it is bookkeeping, and leaving it out keeps the shape
 * plainly serialisable across the server/client boundary rather than shipping
 * a `Date`.
 */
export interface RoomSchedule {
  id: string
  roomId: string
  courseCode: string
  courseDescription: string
  group: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

/** Meetings keyed by the floor-plan room id they are held in. */
export type RoomScheduleMap = Record<string, RoomSchedule[]>
