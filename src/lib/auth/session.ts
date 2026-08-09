import "server-only"

import { headers } from "next/headers"

import { auth, type Session } from "."
import { UnauthorizedError } from "./errors"

/** Reads the current session on the server. Returns null when signed out. */
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() })
}

/**
 * The session, or a refusal — for the code paths that have no signed-out branch
 * to render.
 *
 * Deliberately throws rather than redirects: the sign-in card lives at `/`, so
 * a redirect thrown by something running on `/` would loop. A page that has
 * something to show a signed-out reader uses `getSession` and branches instead.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession()

  if (!session) throw new UnauthorizedError()

  return session
}
