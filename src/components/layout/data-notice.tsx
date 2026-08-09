import { TriangleAlert } from "lucide-react"

import { Container } from "./container"

/**
 * A standing warning that the timetable may not be current.
 *
 * The schedules are ingested from a CSV by hand, so between a term rolling over
 * and the next ingest the map shows wrong times with complete confidence. This
 * says so before anyone acts on it.
 *
 * Amber, on the palette's only non-brand hue: a disclaimer has to read as
 * neither the brand nor an error. Sentence case rather than the uppercase of
 * the "Clock frozen" badge — that is two words in a corner, this is a full line
 * across the viewport.
 *
 * It carries the top safe-area inset because it is now the topmost chrome —
 * `--chrome-inset-top` hands the header's own inset over. See `globals.css`.
 */
export function DataNotice() {
  return (
    <div className="border-b border-warning-foreground/20 bg-warning pt-[env(safe-area-inset-top)] text-warning-foreground">
      <Container className="flex items-center justify-center gap-2 py-2">
        <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
        <p className="text-xs">
          Some room data may be out of date or not yet complete.
        </p>
      </Container>
    </div>
  )
}
