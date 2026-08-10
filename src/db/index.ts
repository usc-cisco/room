import "server-only"

import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import { env } from "@/lib/env"

import * as schema from "./schema"

function createConnection() {
  mkdirSync(dirname(env.databaseUrl), { recursive: true })

  const sqlite = new Database(env.databaseUrl)

  // First, so the pragmas below honour it. `next build` collects page data in
  // eight parallel workers, each of which imports this module and so opens the
  // file; setting the journal mode takes an exclusive lock, and without a
  // timeout the losers fail outright with SQLITE_BUSY rather than waiting. The
  // ingest scripts open their own connections for the same reason.
  sqlite.pragma("busy_timeout = 5000")
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")

  return drizzle(sqlite, { schema })
}

// Next.js hot-reloads modules in development, which would otherwise open a new
// SQLite handle on every edit until the process runs out of file descriptors.
const globalForDb = globalThis as unknown as {
  db?: ReturnType<typeof createConnection>
}

export const db = globalForDb.db ?? createConnection()

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db
}
