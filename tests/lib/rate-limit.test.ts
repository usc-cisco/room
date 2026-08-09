import { beforeEach, describe, expect, test } from "bun:test"

import {
  ACTIONS,
  PAGE_READS,
  rateLimit,
  resetRateLimits,
  trackedKeys,
} from "@/lib/rate-limit"

/** A small budget makes the arithmetic in these tests readable. */
const RULE = { limit: 3, windowMs: 60_000 }

/** A fixed clock: the limiter takes one so tests need not sleep through a window. */
const T0 = 1_700_000_000_000

const spend = (key: string, times: number, now = T0) =>
  Array.from({ length: times }, () => rateLimit(key, RULE, now)).at(-1)!

beforeEach(() => {
  resetRateLimits()
})

describe("rateLimit", () => {
  test("allows exactly the budget, then refuses", () => {
    expect(spend("a", 3).ok).toBe(true)
    expect(rateLimit("a", RULE, T0).ok).toBe(false)
  })

  test("counts the remaining calls down", () => {
    expect(rateLimit("a", RULE, T0).remaining).toBe(2)
    expect(rateLimit("a", RULE, T0).remaining).toBe(1)
    expect(rateLimit("a", RULE, T0).remaining).toBe(0)
  })

  test("reports no wait while the caller is under budget", () => {
    expect(rateLimit("a", RULE, T0).retryAfter).toBe(0)
  })

  test("reports the seconds left when it refuses", () => {
    spend("a", 3)

    // 20 seconds into a 60 second window, 40 remain.
    expect(rateLimit("a", RULE, T0 + 20_000).retryAfter).toBe(40)
  })

  test("never asks the caller to retry in zero seconds", () => {
    spend("a", 3)

    // A refusal in the window's final milliseconds still means "wait a moment",
    // and `Retry-After: 0` reads as "go now" — which would just refuse again.
    expect(rateLimit("a", RULE, T0 + 59_999).retryAfter).toBe(1)
  })

  test("gives the budget back when the window rolls over", () => {
    spend("a", 3)

    expect(rateLimit("a", RULE, T0 + 60_000).ok).toBe(true)
  })

  test("holds a separate budget per key", () => {
    spend("a", 3)

    expect(rateLimit("b", RULE, T0).ok).toBe(true)
    expect(rateLimit("a", RULE, T0).ok).toBe(false)
  })

  test("keeps counting the same key across calls with a moving clock", () => {
    rateLimit("a", RULE, T0)
    rateLimit("a", RULE, T0 + 1_000)
    rateLimit("a", RULE, T0 + 2_000)

    expect(rateLimit("a", RULE, T0 + 3_000).ok).toBe(false)
  })
})

describe("pruning", () => {
  // Without this the limiter is itself a memory vector: a stream of distinct
  // keys would grow the heap until the process dies.
  test("drops windows that have rolled over once the map grows", () => {
    for (let i = 0; i < 1_000; i++) rateLimit(`key-${i}`, RULE, T0)

    expect(trackedKeys()).toBe(1_000)

    rateLimit("later", RULE, T0 + 60_000)

    expect(trackedKeys()).toBe(1)
  })

  test("keeps windows that are still open", () => {
    for (let i = 0; i < 1_000; i++) rateLimit(`key-${i}`, RULE, T0)

    rateLimit("later", RULE, T0 + 30_000)

    expect(trackedKeys()).toBe(1_001)
  })
})

describe("the app's budgets", () => {
  // Pinned so a change to what the app allows is a deliberate edit.
  test("a minute of page reads and of actions", () => {
    expect(PAGE_READS).toEqual({ limit: 60, windowMs: 60_000 })
    expect(ACTIONS).toEqual({ limit: 20, windowMs: 60_000 })
  })
})
