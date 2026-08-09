"use client"

import { RotateCcw, Unplug } from "lucide-react"

import "./globals.css"
import { PageStatus } from "@/components/layout/page-status"
import { ThemeProvider } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * The last resort: the root layout itself failed, so this replaces it — `html`
 * and `body` included — and nothing it set up is available.
 *
 * That means the fonts are gone, hence the fallback stack below, and the theme
 * is only applied once `ThemeProvider` mounts rather than before first paint.
 * A moment of light theme on a page that only appears when everything else is
 * already broken is a fair trade for not shipping an inline script.
 *
 * `app/error.tsx` handles anything that fails inside the page, which is almost
 * everything; treat this one as the fire alarm rather than the door.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <ThemeProvider>
          <main className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
            <PageStatus
              icon={Unplug}
              title="The app did not start"
              description="Something failed before anything could be drawn. Reloading is the only thing left to try."
              footnote={error.digest ? `Reference ${error.digest}` : null}
            >
              <Button onClick={reset}>
                <RotateCcw data-icon="inline-start" />
                Reload
              </Button>
            </PageStatus>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
