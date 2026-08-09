/**
 * Refused for want of a session.
 *
 * Named so a caller — and a log line — can tell "nobody is signed in" apart
 * from "the session store failed", which are the same shape of thrown error but
 * very different problems.
 *
 * Kept apart from `./session`, which is `server-only`: this is a plain class
 * with nothing sensitive in it, and anything that wants to recognise a refusal
 * should be able to import it without dragging the session reader along.
 */
export class UnauthorizedError extends Error {
  constructor(message = "This requires a signed-in user.") {
    super(message)
    this.name = "UnauthorizedError"
  }
}
