"use client"

import Link from "next/link"
import { RotateCcw, TriangleAlert } from "lucide-react"

import { PageStatus } from "@/components/layout/page-status"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  /** Re-renders the segment; the fastest way out if the failure was transient. */
  reset: () => void
}

/**
 * The page's error boundary.
 *
 * The message the reader gets is deliberately not `error.message`: a timetable
 * query or a session read failing says nothing useful to someone standing in a
 * corridor, and in production Next replaces it with a generic string anyway.
 * The digest is shown instead — it is the one thing that ties what they saw to
 * a line in the server log.
 */
export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="grid flex-1 place-items-center p-6">
      <PageStatus
        icon={TriangleAlert}
        title="The app did not load"
        description="Something went wrong on our side. Trying again usually works."
        footnote={error.digest ? `Reference ${error.digest}` : null}
      >
        <Button onClick={reset}>
          <RotateCcw data-icon="inline-start" />
          Try again
        </Button>

        <Button asChild variant="outline">
          <Link href="/">Back to the app</Link>
        </Button>
      </PageStatus>
    </main>
  )
}
