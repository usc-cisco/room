import { headers } from "next/headers"

import { auth, type Session } from "."

/** Reads the current session on the server. Returns null when signed out. */
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() })
}
