# Operations

Running the thing: who may read it, what they read, the switch for when the data
is behind, and the one failure that is the network's rather than the app's.

Both ingest scripts work the same way. The whole file is validated before
anything is written and the insert runs in one transaction, so a CSV with a
single bad row leaves the table untouched rather than half-loaded. Both run
under Node via `tsx`, not Bun — always call them through the npm script.

| Flag        | Effect                                                     |
| ----------- | ---------------------------------------------------------- |
| `--dry-run` | Validate and report, then stop before opening the database |
| `--replace` | Empty the table inside the transaction first               |

Neither flag is positional. Without `--replace` rows are appended.

## Who may read it

```bash
bun run db:ingest-allowlist <file.csv> [--replace] [--dry-run]
```

```csv
usc_id,name
24100907,Geri Gian Epanto
24100908,Someone Else
```

`usc_id` is the part before the `@` in a school address — `24100907` for
`24100907@usc.edu.ph` — and it is unique. Put the id in, not the address: a full
address is rejected, because storing one would leave a row no sign-in can ever
match.

Rejected per row: an empty `usc_id`, a value containing `@`, a value containing
whitespace, an empty `name`. Ids repeated **within the file** are caught before
the transaction opens, since the unique index would otherwise fail with a
message naming neither the id nor the line.

Removing someone is a `--replace` run with a file that omits them, or a delete
in `bun run db:studio`. Their `user` and `session` rows are untouched by that —
they can still sign in, they just meet the refusal page.

## Loading the timetable

```bash
bun run db:ingest-schedules <file.csv> [--replace] [--dry-run]
```

```csv
room_id,course_code,course_description,group,day_of_week,start_time,end_time
LB445,CIS 1101,PROGRAMMING I,Group 1,1,07:30,09:00
```

Column names must match **exactly**. There are no synonyms and no case folding:
a header that is nearly right is reported as missing rather than guessed at, so
a typo can never quietly load a column of empty strings. Extra columns are
ignored, so an export carrying fields the app does not use still works.

| Column                                       | Accepted                                                                                                                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `room_id`                                    | A teaching room, by id (`lb445`) or by the code on the map (`LB445`). Case-insensitive. Comfort rooms, the Control Room and the Department Office are rejected — a class cannot be held in one, and the database cannot catch that itself. |
| `day_of_week`                                | A single digit `0`–`6`, Sunday to Saturday. Day names are **not** accepted: `Tue`, `Tues` and `Thur` are the kind of near-miss spellings that make a helpful parser start guessing.                                                        |
| `start_time`, `end_time`                     | 24-hour `H:MM`/`HH:MM`, or 12-hour `H:MM AM`. Both normalise to zero-padded 24-hour. `end_time` must be after `start_time`.                                                                                                                |
| `course_code`, `course_description`, `group` | Any non-empty text                                                                                                                                                                                                                         |

Every problem in a row is reported at once, not just the first, with the line
number as you would count it in a spreadsheet:

```
error: 2 of 40 rows are invalid; nothing was written.
  line 7: unknown room "LB999"; invalid day_of_week "Tue" (expected 0-6, Sunday to Saturday)
  line 18: end_time 08:00 is not after start_time 09:30
```

### Updating for a new term

Validate first, then replace in one go. `--replace` empties the table inside the
same transaction as the insert, so a failure leaves the old timetable in place.

```bash
bun run db:ingest-schedules data/schedules.csv --dry-run
bun run db:ingest-schedules data/schedules.csv --replace
```

Back the database up first if the rows matter — the schedule table has no
history and nothing here is undoable.

```bash
sqlite3 data/app.db "vacuum into 'backup.db'"
```

## The staleness banner

Schedules are loaded by hand, so between a term rolling over and the next ingest
the map will show wrong times with complete confidence. `SHOW_DATA_NOTICE=true`
puts an amber disclaimer above every screen saying so.

Set it to exactly `true`. Anything else — including `false`, `0` and `no` —
leaves it off, so the classic `SHOW_DATA_NOTICE=false` mistake cannot switch it
on. It needs a restart, not just a reload, since it is read server-side.

Turn it on while the data is known to be behind, and off once an ingest has
caught up.

## When sign-in stops working in the evening

The DCISM host refuses outgoing requests overnight. Google sign-in needs one, so
it fails for as long as that lasts, and there is nothing to fix in the app when
it does — it is the network, and it comes back on its own.

What the reader sees: they press the button, reach Google, consent, and arrive
back on the landing page with a dialog saying the site could not reach Google and
that this usually happens in the evenings. Before that dialog existed they
arrived back with nothing at all, which read as a dead button.

The wording deliberately names no hours. The window is the host's to change, and
copy that states a time is wrong the day it moves.

**The tell, if you are diagnosing a report.** Ask whether the button's label
changes to "Redirecting to Google…" when pressed.

| What happens                                            | Where the fault is                                                                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Label changes, reaches Google, comes back to the dialog | The overnight block. Expected; wait it out.                                                                                                              |
| Label changes but Google is never reached               | Not the block — that first request never leaves the host. Look at the reader's own connection, the 3-per-10s limit on `/sign-in*`, or Apache.            |
| Label never changes                                     | Upstream of this code: the JS never loaded or the handler never attached. Nothing in the sign-in path can report this, because nothing of it is running. |

**Reproducing it deliberately.** Make the token endpoint unreachable from the
server and nothing else — the browser never contacts that host, only
`accounts.google.com`, so this blocks exactly what the firewall blocks:

```bash
echo "192.0.2.1 oauth2.googleapis.com" | sudo tee -a /etc/hosts
```

`192.0.2.1` is non-routable, so packets are dropped and the connection hangs as
it would behind a firewall; `127.0.0.1` fails instantly instead. Test against
`bun run build && bun run start`, **not** `bun run dev` — better-auth's default
error route branches on `NODE_ENV`, so dev would not show you what production
does. Remove the line afterwards:

```bash
sudo sed -i '' '/oauth2.googleapis.com/d' /etc/hosts
```

Browser-level tricks do not work here. DevTools "Offline" and Playwright request
interception only reach requests the _browser_ makes; the failing call is
server-side, inside Node.

For checking the dialog's wording alone, `/?error=invalid_code` and
`/?error=access_denied` render it directly — but they skip the redirect chain,
so they prove the copy and nothing about the wiring.

## Deploying

There is no deploy pipeline in this repo, and no CI. What the code assumes about
production, from its own configuration:

- **One Node process behind Apache**, on the same host. Rate-limit counters are
  in that process's memory; a second instance would double every budget.
- `advanced.ipAddress.trustedProxies` is set to loopback only
  (`127.0.0.1/32`, `::1/128`), which is what makes better-auth read the
  **rightmost** `X-Forwarded-For` entry — the real client. Left to itself it
  reads the leftmost, which a client can set to anything and so pick its own
  rate-limit bucket. **Widen this if the proxy ever moves off-box.**
- `BETTER_AUTH_URL` must be the real public origin and must match the host on
  the Google redirect URI.
- The SQLite file at `DATABASE_URL` needs to live somewhere writable and
  persistent, and it wants backing up — it holds the sessions, the allowlist and
  the timetable.
- `bun run db:migrate` has to run against production before a release carrying a
  new migration.

Build and serve with `bun run build` then `bun run start`.
