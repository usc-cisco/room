const DEFAULT_DATABASE_URL = "./data/app.db"
const DEFAULT_APP_URL = "http://localhost:3000"

function required(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env and fill it in.`
    )
  }

  return value
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  appUrl: process.env.BETTER_AUTH_URL ?? DEFAULT_APP_URL,
  /** Who to write to about being added to the allowlist, or about room data
   *  that disagrees with the floor. Optional: with no address set, the refusal
   *  page and the map disclaimer simply do not offer one. */
  supportEmail: process.env.SUPPORT_EMAIL?.trim() || null,
  /** Exact `"true"`, not a truthiness test: the classic env-flag bug is
   *  `SHOW_DATA_NOTICE=false` switching the thing on. */
  showDataNotice: process.env.SHOW_DATA_NOTICE?.trim().toLowerCase() === "true",
  authSecret: required("BETTER_AUTH_SECRET"),
  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),
} as const
