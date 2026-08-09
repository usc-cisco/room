# room

A live map of the DCISM department floor at the University of San Carlos —
which rooms are in use right now, which are free, and until when.

Reading the timetable needs a Google sign-in on a `usc.edu.ph` address that is
on an allowlist.

## Quick start

```bash
bun install
cp .env.example .env      # Google OAuth values and a secret
bun run db:migrate
bun run dev
```

You will not see the map until your USC id is on the allowlist —
[docs/setup.md](docs/setup.md) has the whole path.

## Docs

- **[Setup](docs/setup.md)** — running it locally, environment variables,
  commands.
- **[Architecture](docs/architecture.md)** — how the pieces fit.
- **[Operations](docs/operations.md)** — loading schedules and allowlist rows
  from CSV.
