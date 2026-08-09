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
  /** Who someone refused by the allowlist should write to. Optional: with no
   *  address set, the refusal page simply does not offer one. */
  supportEmail: process.env.SUPPORT_EMAIL?.trim() || null,
  authSecret: required("BETTER_AUTH_SECRET"),
  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),
} as const
