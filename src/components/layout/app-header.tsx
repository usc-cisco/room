import Image from "next/image"

import { UserMenu } from "@/components/auth/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"

import { Container } from "./container"

/**
 * Intrinsic ratio of the logo is 3784x879 (4.305:1). These props only set the
 * aspect and the generated srcset — the rendered size comes from the classes.
 */
const LOGO_WIDTH = 241
const LOGO_HEIGHT = 56

interface AppHeaderUser {
  name: string
  email: string
  image?: string | null
}

interface AppHeaderProps {
  /** Absent on the landing page, so one header serves signed-in and out. */
  user?: AppHeaderUser
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="border-b border-header-foreground/10 bg-header pt-[var(--chrome-inset-top)] text-header-foreground">
      <Container className="flex items-center justify-between gap-3 py-3">
        {/* Reads as "CISCO – room": the alt text supplies the first half, so
            assistive tech gets the whole name rather than a bare dash. */}
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src="/cisco-big-white.png"
            alt="CISCO"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            priority
            draggable={false}
            className="pointer-events-none h-4 w-auto shrink-0 select-none sm:h-5"
          />
          <span className="truncate text-xs sm:text-sm">&ndash; room</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          {user ? (
            <UserMenu name={user.name} email={user.email} image={user.image} />
          ) : null}
        </div>
      </Container>
    </header>
  )
}
