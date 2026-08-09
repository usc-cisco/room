import { Container } from "@/components/layout/container"
import { Skeleton } from "@/components/ui/skeleton"
import { PLATE_ASPECT } from "@/lib/floor-plan/data"
import { PORTRAIT_ASPECT } from "@/lib/floor-plan/orientation"

/**
 * The page while the session and the timetable are being read.
 *
 * It stands in for the whole screen, header and footer included, because those
 * live in the page rather than the layout — so this has to hold their space or
 * the shell would appear late and shove the map down.
 *
 * The plate keeps its real proportions, taken from the same constants the map
 * draws itself from and turned by the same `md` breakpoint, so the block that
 * appears here is the size and shape of the block that replaces it.
 */
const PLATE_STYLE = {
  "--plate-aspect": `${PLATE_ASPECT.width} / ${PLATE_ASPECT.height}`,
  "--plate-aspect-portrait": `${PORTRAIT_ASPECT.width} / ${PORTRAIT_ASPECT.height}`,
} as React.CSSProperties

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* The header is brand blue at every stage, so it is drawn rather than
          skeletonised: a grey bar here would read as a different app. */}
      <header className="border-b border-header-foreground/10 bg-header pt-[env(safe-area-inset-top)]">
        <Container className="flex items-center justify-between gap-3 py-3">
          <Skeleton className="h-4 w-28 bg-header-foreground/20 sm:h-5" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 bg-header-foreground/20" />
            <Skeleton className="size-7 bg-header-foreground/20" />
          </div>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-12">
          <section aria-busy="true" aria-label="Loading the app">
            <div className="grid gap-5">
              {/* Clock and date. */}
              <div className="grid gap-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>

              <div className="grid gap-3">
                {/* Search, and the button opposite it. */}
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-8 w-full max-w-xs" />
                  <Skeleton className="h-8 w-28" />
                </div>

                <div className="grid gap-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton
                    className="plate w-full border border-foreground/25 max-md:mx-auto max-md:max-w-[26rem] md:min-w-[38rem]"
                    style={PLATE_STYLE}
                  />
                </div>
              </div>
            </div>
          </section>
        </Container>
      </main>

      <footer className="border-t pb-[env(safe-area-inset-bottom)]">
        <Container className="flex justify-center py-4">
          <Skeleton className="h-3 w-40" />
        </Container>
      </footer>
    </div>
  )
}
