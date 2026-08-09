// No `server-only` marker of its own: it reaches the client only through
// `./session`, which carries one, so the build already fails there — and
// leaving it off is what lets the gate be tested with the session read stubbed.
import { ACTIONS, rateLimit } from "@/lib/rate-limit"

import type { Session } from "."
import { RateLimitedError } from "./errors"
import { requireSession } from "./session"

/** What a gated handler is handed, and cannot get any other way. */
export interface AuthedContext {
  session: Session
  user: Session["user"]
}

/**
 * The entry point every server action goes through.
 *
 * The session is resolved before the handler runs, so an action cannot be
 * written that forgets to check: without this wrapper there is no `user` to
 * take, and the gate is the type signature rather than a code-review note.
 *
 * It is also where the per-user rate limit lives: once, in front of every
 * action, instead of a check each author has to remember.
 */
export function authedAction<Input, Output>(
  handler: (context: AuthedContext, input: Input) => Promise<Output>
): (input: Input) => Promise<Output> {
  return async (input: Input) => {
    const session = await requireSession()

    const decision = rateLimit(`actions:${session.user.id}`, ACTIONS)
    if (!decision.ok) throw new RateLimitedError(decision.retryAfter)

    return handler({ session, user: session.user }, input)
  }
}
