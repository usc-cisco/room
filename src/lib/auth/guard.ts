// No `server-only` marker of its own: it reaches the client only through
// `./session` and the allowlist lookup, both of which carry one, so the build
// already fails there — and leaving it off is what lets the gate be tested with
// those two stubbed.
import { isAllowed } from "@/lib/allowlist/queries"
import { ACTIONS, rateLimit } from "@/lib/rate-limit"

import type { Session } from "."
import { NotAllowedError, RateLimitedError } from "./errors"
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
 * The allowlist is checked in the same breath, and in the same order as
 * `listSchedulesByRoom`. Being signed in has never been the question here — an
 * action that only asked for a session would be open to anyone with a Google
 * account, which is precisely what the list exists to stop.
 *
 * It is also where the per-user rate limit lives: once, in front of every
 * action, instead of a check each author has to remember.
 */
export function authedAction<Input, Output>(
  handler: (context: AuthedContext, input: Input) => Promise<Output>
): (input: Input) => Promise<Output> {
  return async (input: Input) => {
    const session = await requireSession()

    if (!isAllowed(session.user.email)) throw new NotAllowedError()

    const decision = rateLimit(`actions:${session.user.id}`, ACTIONS)
    if (!decision.ok) throw new RateLimitedError(decision.retryAfter)

    return handler({ session, user: session.user }, input)
  }
}
