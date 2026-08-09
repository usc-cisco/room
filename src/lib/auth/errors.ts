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

/**
 * Refused because this account is not on the allowlist.
 *
 * Distinct from `UnauthorizedError`: somebody *is* signed in, and telling them
 * to sign in again would send them round a loop that cannot end well.
 */
export class NotAllowedError extends Error {
  constructor(message = "This account is not on the allowlist.") {
    super(message)
    this.name = "NotAllowedError"
  }
}

/**
 * Refused for going too fast.
 *
 * Carries the wait so a caller can say *how long* rather than just *no* — a
 * page can count it down, and a route handler can put it in `Retry-After`.
 */
export class RateLimitedError extends Error {
  /** Seconds until the caller may try again. */
  readonly retryAfter: number

  constructor(retryAfter: number, message = "Too many requests.") {
    super(message)
    this.name = "RateLimitedError"
    this.retryAfter = retryAfter
  }
}
