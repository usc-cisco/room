import Image from "next/image"

import { UserMenu } from "@/components/auth/user-menu"

import { Container } from "./container"

/**
 * Intrinsic ratio of the logo is 3784x879 (4.305:1). These props only set the
 * aspect and the generated srcset — the rendered size comes from the classes.
 */
const LOGO_WIDTH = 241
const LOGO_HEIGHT = 56

interface AppHeaderProps {
  name: string
  email: string
  image?: string | null
}

export function AppHeader({ name, email, image }: AppHeaderProps) {
  return (
    <header className="border-b border-header-foreground/10 bg-header pt-[env(safe-area-inset-top)] text-header-foreground">
      <Container className="flex items-center justify-between gap-3 py-3">
        {/* Reads as "CISCO – room": the alt text supplies the first half, so
            assistive tech gets the whole name rather than a bare dash. */}
        <div className="flex min-w-0 items-center gap-2">
          {/* No inversion: the header is the brand blue in both themes, so the
              white artwork is correct as-authored (6.00:1 against it). */}
          <Image
            src="/cisco-big-white.png"
            alt="CISCO"
            width={LOGO_WIDTH}
            height={LOGO_HEIGHT}
            priority
            className="h-4 w-auto shrink-0 sm:h-5"
          />
          <span className="truncate text-xs sm:text-sm">&ndash; room</span>
        </div>

        <UserMenu name={name} email={email} image={image} />
      </Container>
    </header>
  )
}
