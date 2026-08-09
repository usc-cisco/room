import { describe, expect, test } from "bun:test"

import {
  findDuplicateIds,
  findMissingColumns,
  parseAllowlistRow,
} from "@/lib/allowlist/csv"

const row = (uscId: string, name: string) => ({ usc_id: uscId, name })

describe("findMissingColumns", () => {
  test("returns nothing when both are present", () => {
    expect(findMissingColumns(["usc_id", "name"])).toEqual([])
  })

  test("ignores extra columns", () => {
    expect(findMissingColumns(["usc_id", "name", "year_level"])).toEqual([])
  })

  test("reports a near-miss header as missing rather than guessing", () => {
    expect(findMissingColumns(["uscId", "name"])).toEqual(["usc_id"])
    expect(findMissingColumns(["USC_ID", "name"])).toEqual(["usc_id"])
  })
})

describe("parseAllowlistRow", () => {
  test("accepts a good row", () => {
    const result = parseAllowlistRow(row("24100907", "Geri Gian Epanto"))

    expect(result).toEqual({
      ok: true,
      value: { uscId: "24100907", name: "Geri Gian Epanto" },
    })
  })

  test("trims and lowercases the id", () => {
    const result = parseAllowlistRow(row("  ABC123  ", "  Someone  "))

    expect(result).toEqual({
      ok: true,
      value: { uscId: "abc123", name: "Someone" },
    })
  })

  // A full address here would store a value no sign-in can ever match.
  test("refuses a full email address in usc_id", () => {
    const result = parseAllowlistRow(row("24100907@usc.edu.ph", "Someone"))

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.errors[0]).toContain(
      "looks like an email address"
    )
  })

  test("refuses whitespace inside the id", () => {
    const result = parseAllowlistRow(row("241 00907", "Someone"))

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.errors[0]).toContain("whitespace")
  })

  test("collects every problem in a row rather than the first", () => {
    const result = parseAllowlistRow(row("", ""))

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.errors).toEqual([
      "usc_id is empty",
      "name is empty",
    ])
  })

  test("treats a missing column as empty", () => {
    const result = parseAllowlistRow({ name: "Someone" })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.errors).toEqual(["usc_id is empty"])
  })
})

describe("findDuplicateIds", () => {
  test("returns nothing when every id is distinct", () => {
    expect(
      findDuplicateIds([
        { uscId: "a", name: "A" },
        { uscId: "b", name: "B" },
      ])
    ).toEqual([])
  })

  // Line numbers count the header, so the first data row is line 2.
  test("reports the lines a repeated id appears on", () => {
    expect(
      findDuplicateIds([
        { uscId: "a", name: "A" },
        { uscId: "b", name: "B" },
        { uscId: "a", name: "A again" },
      ])
    ).toEqual([{ uscId: "a", lines: [2, 4] }])
  })
})
