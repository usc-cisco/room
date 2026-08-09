// No `server-only` marker of its own: it reaches the client only through
// `./session`, which carries one, so the build already fails there — and
// leaving it off is what lets the gate be tested with the session read stubbed.
import type { Session } from "."
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
 * It is also the one place a per-user rate limit can attach later — once, in
 * front of every action, instead of a check each author has to remember.
 */
export function authedAction<Input, Output>(
  handler: (context: AuthedContext, input: Input) => Promise<Output>
): (input: Input) => Promise<Output> {
  return async (input: Input) => {
    const session = await requireSession()

    return handler({ session, user: session.user }, input)
  }
}
