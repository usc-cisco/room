import { ShieldX } from "lucide-react"

import { AppFooter } from "@/components/layout/app-footer"
import { AppHeader } from "@/components/layout/app-header"
import { PageStatus } from "@/components/layout/page-status"
import { env } from "@/lib/env"

interface NotAllowedUser {
  name: string
  email: string
  image?: string | null
}

interface NotAllowedProps {
  user: NotAllowedUser
}

/**
 * Shown to a signed-in account that is not on the allowlist.
 *
 * Renders the header, unlike the other page states: sign-out lives in the user
 * menu, and the likeliest fix is that they used the wrong Google account. With
 * no way out this screen would be a dead end for exactly the people it is most
 * likely to catch by mistake.
 */
export function NotAllowed({ user }: NotAllowedProps) {
  const subject = encodeURIComponent(`room access for ${user.email}`)

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader user={user} />

      <main className="grid flex-1 place-items-center p-6">
        <PageStatus
          icon={ShieldX}
          title="You are not on the list"
          description={
            <>
              This app is limited to a list of people, and{" "}
              <span className="font-medium text-foreground">{user.email}</span>{" "}
              is not on it.
              {/* No address configured, no sentence: "write to" with nowhere to
                  write is worse than saying nothing. */}
              {env.supportEmail ? (
                <>
                  {" "}
                  If that looks wrong, write to{" "}
                  <a
                    href={`mailto:${env.supportEmail}?subject=${subject}`}
                    className="text-primary underline underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {env.supportEmail}
                  </a>
                  .
                </>
              ) : null}
            </>
          }
        />
      </main>

      <AppFooter />
    </div>
  )
}
