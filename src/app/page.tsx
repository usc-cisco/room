import { FloorMap } from "@/components/floor-map/floor-map"
import { LandingPage } from "@/components/landing/landing-page"
import { AppFooter } from "@/components/layout/app-footer"
import { AppHeader } from "@/components/layout/app-header"
import { Container } from "@/components/layout/container"
import { SlowDown } from "@/components/layout/slow-down"
import { RateLimitedError } from "@/lib/auth/errors"
import { getSession } from "@/lib/auth/session"
import { listSchedulesByRoom } from "@/lib/schedules/queries"
import type { RoomScheduleMap } from "@/lib/schedules/types"

export default async function Page() {
  const session = await getSession()

  if (!session) {
    return <LandingPage />
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
      <AppHeader user={user} />

      <main className="relative isolate flex-1 overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(30svh,18rem)] brand-glow opacity-50"
        />

        <Container className="py-8 sm:py-12">
          <FloorMap schedulesByRoom={schedulesByRoom} />
        </Container>
      </main>

      <AppFooter />
    </div>
  )
}
