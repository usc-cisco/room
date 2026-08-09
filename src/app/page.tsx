import Link from "next/link"
import { TimerReset } from "lucide-react"

import { SignInCard } from "@/components/auth/sign-in-card"
import { FloorMap } from "@/components/floor-map/floor-map"
import { AppFooter } from "@/components/layout/app-footer"
import { AppHeader } from "@/components/layout/app-header"
import { Container } from "@/components/layout/container"
import { PageStatus } from "@/components/layout/page-status"
import { Button } from "@/components/ui/button"
import { RateLimitedError } from "@/lib/auth/errors"
import { getSession } from "@/lib/auth/session"
import { listSchedulesByRoom } from "@/lib/schedules/queries"
import type { RoomScheduleMap } from "@/lib/schedules/types"

export default async function Page() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="grid min-h-svh place-items-center p-6">
        <SignInCard />
      </main>
    )
  }

  const { user } = session

  let schedulesByRoom: RoomScheduleMap

  try {
    schedulesByRoom = await listSchedulesByRoom()
  } catch (error) {
    // Its own screen rather than the error page: this is a speed bump, not a
    // breakage, and the reader can act on it once they know how long to wait.
    if (error instanceof RateLimitedError) {
      return <SlowDown retryAfter={error.retryAfter} />
    }

    throw error
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader name={user.name} email={user.email} image={user.image} />

      <main className="flex-1">
        <Container className="py-8 sm:py-12">
          <FloorMap schedulesByRoom={schedulesByRoom} />
        </Container>
      </main>

      <AppFooter />
    </div>
  )
}

/**
 * Shown when this account has asked for the timetable too often.
 *
 * "Try again" is a plain link rather than a client reset: the page is a server
 * component, and a fresh request is exactly what is wanted once the window has
 * rolled over.
 */
function SlowDown({ retryAfter }: { retryAfter: number }) {
  return (
    <main className="grid min-h-svh place-items-center p-6">
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
