import "server-only"

import { eq } from "drizzle-orm"

import { db } from "@/db"
import { allowlist } from "@/db/schema"

import { uscIdFromEmail } from "./usc-id"

/**
 * Whether this address belongs to someone who may read the timetable.
 *
 * Refuses before touching the table when the address is not a school one, so a
 * non-USC domain can never match a row by its local part.
 *
 * Synchronous because the better-sqlite3 driver is.
 */
export function isAllowed(email: string): boolean {
  const uscId = uscIdFromEmail(email)
  if (!uscId) return false

  const row = db
    .select({ uscId: allowlist.uscId })
    .from(allowlist)
    .where(eq(allowlist.uscId, uscId))
    .get()

  return row !== undefined
}
