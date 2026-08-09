# Setup

Getting the app running on your machine, from nothing to seeing the map.

## Prerequisites

- **Bun** — installs dependencies and runs the tests.
- **Node** — the ingest scripts run under `tsx`, not Bun. `better-sqlite3` is a
  native module and crashes the Bun runtime on macOS, so those two scripts are
  deliberately Node-only.
- A **Google Cloud** project, for OAuth credentials.

Neither runtime is pinned in `package.json` — there is no `engines` field.

## 1. Install and configure

```bash
bun install
cp .env.example .env
```

`src/lib/env.ts` throws on startup if `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`
or `GOOGLE_CLIENT_SECRET` are missing, so fill those in before anything else.

```bash
openssl rand -base64 32    # BETTER_AUTH_SECRET
```

### Environment variables

| Variable               | Required | Default                 | What it does                                                                                                                                                                                                                            |
| ---------------------- | -------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`   | **yes**  | —                       | Signs sessions. Generate with the command above.                                                                                                                                                                                        |
| `GOOGLE_CLIENT_ID`     | **yes**  | —                       | OAuth client id.                                                                                                                                                                                                                        |
| `GOOGLE_CLIENT_SECRET` | **yes**  | —                       | OAuth client secret.                                                                                                                                                                                                                    |
| `DATABASE_URL`         | no       | `./data/app.db`         | SQLite file. Relative paths resolve from the project root; the directory is created if missing.                                                                                                                                         |
| `BETTER_AUTH_URL`      | no       | `http://localhost:3000` | Public origin. Must match the host on your Google redirect URI, and is the base for the canonical URL, the Open Graph image, `robots.txt` and `sitemap.xml` — set it correctly in production or every one of those points at localhost. |
| `SUPPORT_EMAIL`        | no       | none                    | Shown to a signed-in account that is not on the allowlist, as the address to ask about being added. Leave it unset and the refusal page simply offers no address.                                                                       |
| `SHOW_DATA_NOTICE`     | no       | off                     | Set to exactly `true` to show the staleness banner above every screen. Anything else — including `false` — leaves it off.                                                                                                               |
| `NEXT_PUBLIC_DEV_NOW`  | no       | real clock              | Development only. Freezes the app's clock so you can look at any time of day. Ignored in production builds.                                                                                                                             |

`NEXT_PUBLIC_DEV_NOW` is read in `src/lib/schedules/clock.ts` rather than
`env.ts`, because the clock is read inside a client component and `env.ts`
throws without the auth secrets.

## 2. Google OAuth

In **Google Cloud Console → APIs & Services → Credentials**, create an OAuth
client ID of type _Web application_ and add this authorised redirect URI:

```
http://localhost:3000/api/auth/callback/google
```

Google is the only sign-in method — email and password are switched off in
`src/lib/auth/index.ts`. In production the redirect URI host must match
`BETTER_AUTH_URL`.

## 3. Create the database

```bash
bun run db:migrate
```

This applies everything in `drizzle/` to the file at `DATABASE_URL`. It creates
the better-auth tables plus `schedule` and `allowlist`.

## 4. Put yourself on the allowlist

Signing in is not enough — the app checks your USC id against the `allowlist`
table and shows a refusal page if it is not there. Add yourself:

```bash
printf 'usc_id,name\n24100907,Your Name\n' > data/allowlist.csv
bun run db:ingest-allowlist data/allowlist.csv
```

The `usc_id` is the part of your school address before the `@` — `24100907` for
`24100907@usc.edu.ph`. Only `usc.edu.ph` addresses resolve to an id at all, so a
Gmail account will be refused no matter what is on the list.

## 5. Load a timetable

Without schedules the map draws but every room reads as free. See
[operations](operations.md#loading-the-timetable) for the CSV format.

```bash
bun run db:ingest-schedules data/schedules.csv --dry-run   # validate only
bun run db:ingest-schedules data/schedules.csv --replace
```

## 6. Run it

```bash
bun run dev
```

Open `http://localhost:3000`. Signed out you get the landing page; signed in
and allowlisted you get the map.

## Checks before committing

```bash
bun run lint
bun run typecheck
bun test
bun run format:check
```

Husky and lint-staged run formatting and linting on commit, and commitlint
enforces [Conventional Commits](https://www.conventionalcommits.org/) —
`type(scope): message`.

## Every command

| Command                                   | What it does                                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `bun run dev`                             | Development server                                                                                                               |
| `bun run build` / `bun run start`         | Production build and serve                                                                                                       |
| `bun test`                                | Unit tests (166 across 13 files)                                                                                                 |
| `bun run lint` / `bun run typecheck`      | ESLint / `tsc --noEmit`                                                                                                          |
| `bun run format` / `bun run format:check` | Prettier                                                                                                                         |
| `bun run db:generate` / `db:migrate`      | Create and apply migrations                                                                                                      |
| `bun run db:studio`                       | Browse the database                                                                                                              |
| `bun run db:ingest-schedules <file.csv>`  | Load the timetable                                                                                                               |
| `bun run db:ingest-allowlist <file.csv>`  | Load who may read it                                                                                                             |
| `bun run auth:generate`                   | Regenerate the better-auth tables in `src/db/schema.ts` — **rewrites the file and does not reproduce `schedule` or `allowlist`** |

## Troubleshooting

**`Missing required environment variable: …`** — one of the three required vars
is absent from `.env`.

**You sign in and land on "You are not on the list"** — your USC id is not in
the `allowlist` table, or you signed in with a non-`usc.edu.ph` Google account.
Check which address you used; the page names it.

**"Too many requests"** — 60 page reads per minute per account. It clears on its
own; the page tells you how many seconds to wait.

**`bun run db:ingest-*` crashes immediately** — run it through the npm script,
not `bun scripts/…`. The scripts need Node via `tsx`.

**The database directory does not exist** — it is created automatically on first
connection, so this usually means `DATABASE_URL` points somewhere unwritable.
