# Architecture

How the app is put together, and why in a few places where the reason is not
obvious from the code.

## One route

There is exactly one page — `/` — plus better-auth's catch-all at
`/api/auth/[...all]`. No middleware.

```
src/app/
  page.tsx              /  — landing, refusal, rate-limit or map
  layout.tsx            fonts, theme, the staleness banner, metadata
  loading.tsx           skeleton that holds the shell's shape
  error.tsx             page error boundary
  global-error.tsx      the root layout itself failed; renders its own html/body
  not-found.tsx         404
  api/auth/[...all]/    better-auth GET and POST
```

`page.tsx` branches four ways:

| Condition          | What renders                                       |
| ------------------ | -------------------------------------------------- |
| No session         | `LandingPage` — public, touches no data            |
| `NotAllowedError`  | `NotAllowed` — the account is not on the allowlist |
| `RateLimitedError` | `SlowDown` — with the seconds to wait              |
| Otherwise          | The floor map                                      |

The last three are reached by catching what `listSchedulesByRoom()` throws
rather than by checking first. That is deliberate — see below.

## The access-control chain

Three gates, in this order, in both entry points that resolve a session:

```
requireSession()  →  isAllowed(email)  →  rateLimit()  →  read
```

They live in `src/lib/schedules/queries.ts` (the timetable read) and
`src/lib/auth/guard.ts` (`authedAction`, the wrapper every future server action
goes through). Putting them in the query rather than the page is the point: a
page, route handler or action written later cannot read the timetable by
forgetting to ask. `listSchedules()` — the ungated version — is not exported, so
the only way out of the module is through the gate.

The allowlist check sits **before** the rate limit so a refused reader is told
the real reason rather than "too many requests" on their sixtieth reload.

### Deriving the USC id

`uscIdFromEmail` in `src/lib/allowlist/usc-id.ts` returns the local part of an
address **only** when the domain is exactly `usc.edu.ph`.

The exactness matters. Any Google account can reach the sign-in, and
`24100907@gmail.com` is a registerable address — matching on the local part
alone would hand it a row meant for a student. A suffix check would not be
enough either: `usc.edu.ph.example.com` ends with the domain and
`mail.usc.edu.ph` contains it, and neither is ours.

### What sign-in does and does not gate

Signing in is not gated. Anyone with a Google account can authenticate and get
`user`, `session` and `account` rows written; they then meet the refusal page.
better-auth's own limits are the only thing bounding that: 30 requests per 60
seconds on the auth endpoints, and a built-in 3-per-10s on `/sign-in*`.

### Rate limits

In `src/lib/rate-limit.ts`, fixed-window and per user:

| Rule         | Budget                                                      |
| ------------ | ----------------------------------------------------------- |
| `PAGE_READS` | 60 per minute — a page load; generous, a person is clicking |
| `ACTIONS`    | 20 per minute — anything through `authedAction`             |

Counters live in this process's memory. The app is one Node process behind
Apache, so there is no second instance to share them with and no case for Redis
to protect a floor's timetable. The trade is stated rather than hidden: budgets
reset when the process does, and a second instance would double them.

## Data

SQLite through Drizzle, WAL mode, foreign keys on. The client in
`src/db/index.ts` is cached on `globalThis` outside production so hot reload
does not exhaust file descriptors.

Four tables come from better-auth — `user`, `session`, `account`,
`verification`. Two are hand-written:

**`schedule`** — one row per weekly meeting.

| Column                                       | Notes                                                                                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `room_id`                                    | A floor-plan space id, e.g. `lb445`. **Not** a foreign key — rooms are static data in `src/lib/floor-plan/data.ts`, so SQLite cannot enforce it. Validated against `CLASS_ROOMS` at the write boundary. |
| `course_code`, `course_description`, `group` | Text, all required                                                                                                                                                                                      |
| `day_of_week`                                | `0`–`6`, Sunday first, matching `Date.getDay()`                                                                                                                                                         |
| `start_time`, `end_time`                     | Zero-padded 24-hour `HH:MM` **text**. These repeat weekly and carry no date; zero-padding keeps them sortable and comparable as plain strings.                                                          |

Four CHECK constraints enforce the day range, both time formats, and that a
class does not end before it starts. One index, on `(room_id, day_of_week)` —
the question the table exists to answer is "what is on in this room, today".

**`allowlist`** — `usc_id` (unique), `name`. Keyed on the USC id rather than
`user.id` because a person goes on the list before they have ever signed in, so
there is no user row to point at.

> `bun run auth:generate` rewrites `src/db/schema.ts` and does **not** reproduce
> `schedule` or `allowlist`. Re-run it with care.

### Reading the timetable

`listSchedulesByRoom()` reads the whole table in one query and groups it by
room. It is a couple of hundred rows for a single floor, so handing all of it to
the client makes opening a room instant and costs no request per click. Every
day is included so the browser decides what "today" is in the viewer's own
timezone.

`src/lib/schedules/types.ts` holds the shapes, separately from `queries.ts`.
That module imports the database client, and a client component importing any
_value_ from it would drag better-sqlite3 into the browser bundle;
`import type` is erased at compile time.

## The floor plate

`src/lib/floor-plan/data.ts` describes the floor as a 32-column CSS grid. Every
size is measured off the posted evacuation plan rather than eyeballed: one grid
column is 37.5 plan units, a quarter of a classroom, so a classroom is four
columns wide.

The map is the plan turned a quarter turn clockwise, so it reads landscape on a
screen — the plan's three north–south wings become three horizontal bands, and a
wing's north end is the map's right edge. Below the `md` breakpoint the plate is
transposed back to portrait by `src/lib/floor-plan/orientation.ts`, which swaps
each cell's row and column rather than redrawing anything.

Twenty named spaces: 14 teaching rooms, 4 comfort rooms, and 2 facilities (the
Control Room and the Department Office). Only teaching rooms hold classes, which
is why the CSV validator rejects a schedule pointing at anything else.

## Front end

Server components by default. The map is a client component because it owns a
clock, a search query and the selected room; everything below it is
presentational.

Occupancy tinting is held back until after hydration — the server's clock and
the browser's can legitimately differ, and a mismatch would land on the
`className` of every cell on the plate.

## SEO and link previews

`src/app/layout.tsx` holds the metadata. `metadataBase` comes from
`BETTER_AUTH_URL`, which is what turns the relative `/og.jpg` into the absolute
URL unfurlers require — so that variable being wrong in production means every
preview and canonical URL points at localhost.

The description deliberately names the subject rather than repeating the hero
line: a search result and a link preview are read by someone who has not
arrived, and "check what's available" tells them nothing about rooms, the floor
or the university.

Two generated routes, both Next file conventions: `src/app/robots.ts` opens the
site but disallows `/api/`, which answers nothing a crawler can use, and
`src/app/sitemap.ts` lists the single route. There is one page and it is the
landing page — everything else is behind the session and the allowlist, so a
crawler never sees the map.

## Security

Headers are set in `next.config.ts` for every path, and asserted in
`tests/security-headers.test.ts` against the exported array the app actually
serves:

`Strict-Transport-Security` (no `preload` — that commits the whole apex domain)
· `X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY` ·
`Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy`
denying nine features · `Cross-Origin-Opener-Policy: same-origin`.

**There is no Content-Security-Policy.** A useful one needs a nonce threaded
through every render, and that has not been done. It is the obvious next
hardening step.

`Cross-Origin-Opener-Policy: same-origin` is only safe because sign-in is a
top-level redirect. If better-auth is ever switched to popup mode it must become
`same-origin-allow-popups`.

## Tests

166 tests across 13 files, run with `bun test`. They cover the pure logic in
`src/lib` — availability, occupancy, formatting, search, the floor-plan grid and
its transpose, both CSV validators, the USC id derivation, rate limiting, the
auth guard — plus the security headers.

Nothing covers `src/app`, `src/components`, `src/db` or the ingest scripts. The
database is deliberately untouched by tests, which is why `guard.ts` carries no
`server-only` marker: leaving it off is what lets the gate be tested with the
session read and the allowlist stubbed.
