import { relations, sql } from "drizzle-orm"
import {
  sqliteTable,
  text,
  integer,
  index,
  check,
} from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
)

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
)

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

/**
 * A recurring class held in a room, one row per weekly meeting.
 *
 * Note: `bun run auth:generate` writes this file. Re-run it with care — the
 * tables below the auth ones (`schedule` and `allowlist`) are hand-written and
 * are not reproduced by the generator.
 */
export const schedule = sqliteTable(
  "schedule",
  {
    id: text("id").primaryKey(),

    /**
     * The `id` of a space in the static floor plan (e.g. `lb445`, `control`),
     * not a foreign key — rooms live in `src/lib/floor-plan/data.ts`, not the
     * database, so SQLite cannot enforce this. Validate it against
     * `CLASS_ROOMS` at the write boundary.
     */
    roomId: text("room_id").notNull(),

    courseCode: text("course_code").notNull(),
    courseDescription: text("course_description").notNull(),
    /** Section/block the class is for, e.g. `G1`. */
    group: text("group").notNull(),
    /** Degree program the section belongs to, e.g. `BSIT`. */
    program: text("program").notNull(),

    /** 0 = Sunday through 6 = Saturday, matching JS `Date.getDay()`. */
    dayOfWeek: integer("day_of_week").notNull(),

    /**
     * Wall-clock time as zero-padded 24-hour `HH:MM`. Text rather than a
     * timestamp because these repeat weekly and carry no date; zero-padding
     * keeps them correctly sortable and comparable as plain strings.
     */
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    // The query this table exists to answer: what is on in this room, today.
    index("schedule_roomId_dayOfWeek_idx").on(table.roomId, table.dayOfWeek),
    check(
      "schedule_day_of_week_range",
      sql`${table.dayOfWeek} between 0 and 6`
    ),
    check(
      "schedule_start_time_format",
      sql`${table.startTime} glob '[0-2][0-9]:[0-5][0-9]'`
    ),
    check(
      "schedule_end_time_format",
      sql`${table.endTime} glob '[0-2][0-9]:[0-5][0-9]'`
    ),
    // A class cannot end before it starts. String comparison is correct here
    // because both sides are zero-padded 24-hour times.
    check("schedule_time_order", sql`${table.endTime} > ${table.startTime}`),
  ]
)

/**
 * Who may read the timetable, keyed on USC id rather than on `user.id`: a
 * person is put on the list before they have ever signed in, so there is no row
 * to point a foreign key at.
 */
export const allowlist = sqliteTable("allowlist", {
  id: text("id").primaryKey(),

  /** Local part of the school address, e.g. `24100907` of `24100907@usc.edu.ph`. */
  uscId: text("usc_id").notNull().unique(),

  name: text("name").notNull(),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))
