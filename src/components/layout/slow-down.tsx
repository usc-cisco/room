import { TimerReset } from "lucide-react"
import Link from "next/link"

import { PageStatus } from "@/components/layout/page-status"
import { Button } from "@/components/ui/button"

interface SlowDownProps {
  /** Seconds until the rate-limit window rolls over. */
  retryAfter: number
}

/**
 * Shown when this account has asked for the timetable too often. "Try again" is
 * a plain link, not a client reset: a fresh request is what is wanted once the
 * window has rolled over.
 */
export function SlowDown({ retryAfter }: SlowDownProps) {
  return (
    <main className="grid flex-1 place-items-center p-6">
      <PageStatus
        icon={TimerReset}
        title="Too many requests"
        description={`This account has loaded the app a lot in the last minute. Try again in ${retryAfter} ${retryAfter === 1 ? "second" : "seconds"}.`}
      >
        <Button asChild>
          <Link href="/">Try again</Link>
        </Button>
      </PageStatus>
    </main>
  )
}
