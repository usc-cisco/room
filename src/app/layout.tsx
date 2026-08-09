import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { DataNotice } from "@/components/layout/data-notice"
import { ThemeProvider } from "@/components/theme-provider"
import { env } from "@/lib/env"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const TITLE = "CISCO – room"
const DESCRIPTION = "Check what's available, all in one place."

/** No `openGraph.images`: the only mark is white-on-transparent and would
 *  unfurl as an empty tile on most backgrounds. */
export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      {/* The body owns the viewport, not the pages: each shell below takes
          `flex-1`, so the notice adds its height by shrinking the page rather
          than by pushing it into a scroll. Zeroing `--chrome-inset-top` hands
          the top safe area from the header to the notice above it. */}
      <body
        className={cn(
          "flex min-h-svh flex-col",
          env.showDataNotice && "[--chrome-inset-top:0px]"
        )}
      >
        <ThemeProvider>
          {env.showDataNotice ? <DataNotice /> : null}
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
