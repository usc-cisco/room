import { FloorMap } from "@/components/floor-map/floor-map"
import { LandingPage } from "@/components/landing/landing-page"
import { AppFooter } from "@/components/layout/app-footer"
import { AppHeader } from "@/components/layout/app-header"
import { Container } from "@/components/layout/container"
import { NotAllowed } from "@/components/layout/not-allowed"
import { SlowDown } from "@/components/layout/slow-down"
import { NotAllowedError, RateLimitedError } from "@/lib/auth/errors"
import { getSession } from "@/lib/auth/session"
import { env } from "@/lib/env"
import { listSchedulesByRoom } from "@/lib/schedules/queries"
import type { RoomScheduleMap } from "@/lib/schedules/types"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({ searchParams }: PageProps) {
  const session = await getSession()

  if (!session) {
    // A failed sign-in comes back here carrying its reason. Only the landing
    // page has anything to do with it; once signed in, it is stale by
    // definition.
    const { error } = await searchParams

    return (
      <LandingPage authError={typeof error === "string" ? error : undefined} />
    )
  }

  const { user } = session

  let schedulesByRoom: RoomScheduleMap

  try {
    schedulesByRoom = await listSchedulesByRoom()
  } catch (error) {
    if (error instanceof NotAllowedError) {
      return <NotAllowed user={user} />
    }

    // Its own screen rather than the error page: this is a speed bump, not a
    // breakage, and the reader can act on it once they know how long to wait.
    if (error instanceof RateLimitedError) {
      return <SlowDown retryAfter={error.retryAfter} />
    }

    throw error
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader user={user} />

      <main className="relative isolate flex-1 overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(30svh,18rem)] brand-glow opacity-50"
        />

        <Container className="py-8 sm:py-12">
          <FloorMap
            schedulesByRoom={schedulesByRoom}
            supportEmail={env.supportEmail}
          />
        </Container>
      </main>

      <AppFooter />
    </div>
  )
}
