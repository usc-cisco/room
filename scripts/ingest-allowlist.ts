/**
 * Loads a CSV of allowed people into the `allowlist` table.
 *
 *   bun run db:ingest-allowlist <file.csv> [--replace] [--dry-run]
 *
 * Runs under tsx (Node) rather than Bun: better-sqlite3 is a native module and
 * crashes the Bun runtime on this platform.
 *
 * The whole file is validated before anything is written, and the insert runs
 * in a transaction — a CSV with one bad row leaves the table untouched rather
 * than half-loaded.
 */
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import Database from "better-sqlite3"
import { parse } from "csv-parse/sync"
import { drizzle } from "drizzle-orm/better-sqlite3"

import { allowlist } from "@/db/schema"
import {
  REQUIRED_COLUMNS,
  findDuplicateIds,
  findMissingColumns,
  parseAllowlistRow,
  type AllowlistInput,
} from "@/lib/allowlist/csv"

const DATABASE_URL = process.env.DATABASE_URL ?? "./data/app.db"

function fail(message: string): never {
  console.error(`error: ${message}`)
  process.exit(1)
}

function main() {
  const args = process.argv.slice(2)
  const replace = args.includes("--replace")
  const dryRun = args.includes("--dry-run")
  const [filePath] = args.filter((arg) => !arg.startsWith("--"))

  if (!filePath) {
    fail(
      "no CSV path given.\n" +
        "usage: bun run db:ingest-allowlist <file.csv> [--replace] [--dry-run]"
    )
  }

  const absolutePath = resolve(filePath)
  let contents: string
  try {
    contents = readFileSync(absolutePath, "utf8")
  } catch {
    fail(`cannot read ${absolutePath}`)
  }

  let records: Record<string, string>[]
  try {
    records = parse(contents, {
      columns: true,
      skipEmptyLines: true,
      trim: true,
      bom: true,
    })
  } catch (error) {
    fail(`could not parse CSV: ${(error as Error).message}`)
  }

  if (!records.length) {
    fail("the CSV has no data rows")
  }

  const missing = findMissingColumns(Object.keys(records[0]))
  if (missing.length) {
    fail(
      `the CSV is missing these columns: ${missing.join(", ")}\n` +
        `column names must match exactly: ${REQUIRED_COLUMNS.join(", ")}`
    )
  }

  const rows: AllowlistInput[] = []
  const problems: string[] = []

  records.forEach((record, index) => {
    const result = parseAllowlistRow(record)
    if (result.ok) {
      rows.push(result.value)
      return
    }
    // +2: one for the header row, one because humans count from 1.
    problems.push(`  line ${index + 2}: ${result.errors.join("; ")}`)
  })

  if (problems.length) {
    console.error(
      `error: ${problems.length} of ${records.length} rows are invalid; nothing was written.`
    )
    console.error(problems.join("\n"))
    process.exit(1)
  }

  const duplicates = findDuplicateIds(rows)
  if (duplicates.length) {
    console.error(
      `error: ${duplicates.length} usc_id${duplicates.length === 1 ? " appears" : "s appear"} more than once; nothing was written.`
    )
    console.error(
      duplicates
        .map(({ uscId, lines }) => `  ${uscId}: lines ${lines.join(", ")}`)
        .join("\n")
    )
    process.exit(1)
  }

  if (dryRun) {
    console.log(
      `${rows.length} rows are valid. No changes written (--dry-run).`
    )
    return
  }

  const sqlite = new Database(DATABASE_URL)
  sqlite.pragma("foreign_keys = ON")
  const db = drizzle(sqlite, { schema: { allowlist } })

  let removed = 0
  sqlite.transaction(() => {
    if (replace) {
      removed = sqlite.prepare("delete from allowlist").run().changes
    }

    for (const row of rows) {
      db.insert(allowlist)
        .values({ id: randomUUID(), ...row })
        .run()
    }
  })()

  sqlite.close()

  console.log(
    replace
      ? `Replaced ${removed} rows with ${rows.length} from ${filePath}.`
      : `Inserted ${rows.length} rows from ${filePath}.`
  )
}

main()
