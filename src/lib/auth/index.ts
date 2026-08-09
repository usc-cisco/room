// Holds the auth secret and the Google client secret by way of `env`, so a
// client component reaching this should fail the build rather than ship them.
import "server-only"

import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"

import { db } from "@/db"
import * as schema from "@/db/schema"

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
    },
  },
  // Must be the last plugin so it can set cookies on the outgoing response.
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
