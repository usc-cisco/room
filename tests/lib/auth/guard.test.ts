import { beforeEach, describe, expect, mock, test } from "bun:test"

import type { Session } from "@/lib/auth"
import { NotAllowedError, UnauthorizedError } from "@/lib/auth/errors"

/**
 * The session read and the allowlist lookup are replaced rather than
 * exercised: between them they reach into `next/headers` and a database,
 * neither of which says anything about the question here — does the gate run
 * the handler, or refuse it?
 */
let session: Session | null = null
let allowed = true

mock.module("@/lib/auth/session", () => ({
  UnauthorizedError,
  async requireSession() {
    if (!session) throw new UnauthorizedError()
    return session
  },
}))

mock.module("@/lib/allowlist/queries", () => ({
  isAllowed: () => allowed,
}))

const { authedAction } = await import("@/lib/auth/guard")

const SIGNED_IN = {
  user: { id: "u1", email: "24100907@usc.edu.ph" },
  session: { id: "s1" },
} as unknown as Session

beforeEach(() => {
  session = null
  allowed = true
})

describe("authedAction", () => {
  test("refuses when nobody is signed in", () => {
    const action = authedAction(async () => "ran")

    expect(action(undefined)).rejects.toThrow(UnauthorizedError)
  })

  test("does not run the handler when it refuses", async () => {
    let ran = false
    const action = authedAction(async () => {
      ran = true
      return "ran"
    })

    await action(undefined).catch(() => {})

    expect(ran).toBe(false)
  })

  // Being signed in was never the question: without this, any Google account
  // could reach an action the allowlist is supposed to be guarding.
  test("refuses a signed-in account that is not on the allowlist", () => {
    session = SIGNED_IN
    allowed = false
    const action = authedAction(async () => "ran")

    expect(action(undefined)).rejects.toThrow(NotAllowedError)
  })

  test("does not run the handler for an account off the allowlist", async () => {
    session = SIGNED_IN
    allowed = false
    let ran = false
    const action = authedAction(async () => {
      ran = true
      return "ran"
    })

    await action(undefined).catch(() => {})

    expect(ran).toBe(false)
  })

  test("hands the session and user to the handler", async () => {
    session = SIGNED_IN
    const action = authedAction(async (context) => context)

    const context = await action(undefined)

    expect(context.session).toBe(SIGNED_IN)
    expect(context.user).toBe(SIGNED_IN.user)
  })

  test("passes the input through and returns what the handler returns", async () => {
    session = SIGNED_IN
    const action = authedAction(async (_context, input: number) => input * 2)

    expect(await action(21)).toBe(42)
  })

  // A failure inside the handler is not a refusal, and flattening the two would
  // hide a broken action behind a sign-in prompt.
  test("lets the handler's own failure through", () => {
    session = SIGNED_IN
    const action = authedAction(async () => {
      throw new Error("the handler broke")
    })

    expect(action(undefined)).rejects.toThrow("the handler broke")
  })
})
