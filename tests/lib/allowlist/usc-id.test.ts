import { describe, expect, test } from "bun:test"

import { uscIdFromEmail } from "@/lib/allowlist/usc-id"

describe("uscIdFromEmail", () => {
  test("reads the id out of a school address", () => {
    expect(uscIdFromEmail("24100907@usc.edu.ph")).toBe("24100907")
  })

  test("accepts a non-numeric local part", () => {
    expect(uscIdFromEmail("someone@usc.edu.ph")).toBe("someone")
  })

  test("lowercases and trims", () => {
    expect(uscIdFromEmail("  ABC123@USC.EDU.PH  ")).toBe("abc123")
  })

  // The reason the domain is checked at all. Any Google account can reach the
  // sign-in, and this address is registerable.
  test("refuses a lookalike on another domain", () => {
    expect(uscIdFromEmail("24100907@gmail.com")).toBeNull()
  })

  test("refuses a domain that merely ends with the school one", () => {
    expect(uscIdFromEmail("24100907@usc.edu.ph.example.com")).toBeNull()
    expect(uscIdFromEmail("24100907@notusc.edu.ph")).toBeNull()
  })

  test("refuses a subdomain of the school one", () => {
    expect(uscIdFromEmail("24100907@mail.usc.edu.ph")).toBeNull()
  })

  test("refuses an address with no domain", () => {
    expect(uscIdFromEmail("24100907")).toBeNull()
    expect(uscIdFromEmail("24100907@")).toBeNull()
  })

  test("refuses an empty local part", () => {
    expect(uscIdFromEmail("@usc.edu.ph")).toBeNull()
    expect(uscIdFromEmail("")).toBeNull()
  })

  // Two separators mean a malformed address, not a local part containing one.
  test("refuses more than one @", () => {
    expect(uscIdFromEmail("a@b@usc.edu.ph")).toBeNull()
    expect(uscIdFromEmail("24100907@usc.edu.ph@evil.com")).toBeNull()
  })
})
