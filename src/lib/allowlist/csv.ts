import { USC_DOMAIN } from "./usc-id"

/** A validated row, shaped for insertion into the `allowlist` table. */
export interface AllowlistInput {
  uscId: string
  /** Null when the CSV has no `name` column, or leaves the cell empty. */
  name: string | null
}

export type ParseResult =
  { ok: true; value: AllowlistInput } | { ok: false; errors: string[] }

/**
 * The one accepted spelling of each column: the table's own column names,
 * matched exactly. No synonyms and no case folding — a header that is nearly
 * right is reported as missing rather than guessed at.
 */
export const CSV_COLUMNS = {
  uscId: "usc_id",
  name: "name",
} as const satisfies Record<keyof AllowlistInput, string>

/**
 * Every column an allowlist CSV must carry.
 *
 * The id alone decides who may sign in, so a roster export listing nothing
 * else is a complete allowlist; `name` is optional and stored as null when it
 * is absent.
 */
export const REQUIRED_COLUMNS: readonly string[] = [CSV_COLUMNS.uscId]

/**
 * Required columns absent from a header row, in declaration order. Extra
 * columns are ignored, so an export can carry fields we do not use.
 */
export function findMissingColumns(headers: readonly string[]): string[] {
  const present = new Set(headers.map((header) => header.trim()))

  return REQUIRED_COLUMNS.filter((column) => !present.has(column))
}

/** Validates one CSV record, collecting every problem rather than the first. */
export function parseAllowlistRow(record: Record<string, string>): ParseResult {
  const errors: string[] = []
  const read = (field: keyof AllowlistInput) =>
    (record[CSV_COLUMNS[field]] ?? "").trim()

  const uscId = read("uscId").toLowerCase()
  if (!uscId) {
    errors.push("usc_id is empty")
  } else if (uscId.includes("@")) {
    // The column holds the id, not the address the id was read out of. Letting
    // a full address through would store a value no sign-in can ever match.
    errors.push(
      `usc_id ${JSON.stringify(read("uscId"))} looks like an email address ` +
        `(use just the part before @${USC_DOMAIN})`
    )
  } else if (/\s/.test(uscId)) {
    errors.push(`usc_id ${JSON.stringify(read("uscId"))} contains whitespace`)
  }

  const name = read("name")

  if (errors.length) {
    return { ok: false, errors }
  }

  return { ok: true, value: { uscId, name: name || null } }
}

/**
 * Ids appearing more than once, with the line each repeat is on.
 *
 * Caught here rather than left to the unique index: the constraint would fail
 * the transaction with a message naming neither the id nor the line.
 */
export function findDuplicateIds(
  rows: readonly AllowlistInput[]
): { uscId: string; lines: number[] }[] {
  const lines = new Map<string, number[]>()

  rows.forEach((row, index) => {
    // +2: one for the header row, one because humans count from 1.
    lines.set(row.uscId, [...(lines.get(row.uscId) ?? []), index + 2])
  })

  return [...lines]
    .filter(([, seen]) => seen.length > 1)
    .map(([uscId, seen]) => ({ uscId, lines: seen }))
}
