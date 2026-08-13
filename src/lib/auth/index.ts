// Holds the auth secret and the Google client secret by way of `env`, so a
// client component reaching this should fail the build rather than ship them.
import "server-only"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"

import { db } from "@/db"
import * as schema from "@/db/schema"

import { USC_DOMAIN } from "../allowlist/usc-id"
import { env } from "../env"

export const auth = betterAuth({
  baseURL: env.appUrl,
  secret: env.authSecret,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  // Google is the only supported sign-in method, so email/password stays off.
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
      // Narrows Google's account chooser to the school domain. A hint only —
      // `isAllowed` is still what decides who gets in.
      hd: USC_DOMAIN,
    },
  },
  // These endpoints are the only ones a stranger can reach, so they carry their
  // own budget, in this process's memory like ours. `/sign-in*` is tighter than
  // the figure below — better-auth applies a built-in 3-per-10s rule to it once
  // rate limiting is on, which is the path worth protecting most.
  //
  // On in development too: a limiter that only exists in production is one
  // nobody has ever seen refuse anything.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    storage: "memory",
  },
  advanced: {
    // Apache appends the real client address to `X-Forwarded-For`, so the
    // *rightmost* entry is the true one. Naming the hops we trust is what makes
    // better-auth strip from that end — left to itself it reads the leftmost,
    // which a client can set to anything and so pick its own bucket.
    //
    // Loopback is right while Apache and Node share the host on
    // room.dcism.org. Widen this if the proxy ever moves off-box.
    ipAddress: {
      trustedProxies: ["127.0.0.1/32", "::1/128"],
    },
  },
  // Must be the last plugin so it can set cookies on the outgoing response.
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
