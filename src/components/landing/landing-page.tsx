import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { AppFooter } from "@/components/layout/app-footer"
import { AppHeader } from "@/components/layout/app-header"
import { Container } from "@/components/layout/container"
import { USC_DOMAIN } from "@/lib/allowlist/usc-id"

import { WhySignIn } from "./why-sign-in"

interface LandingPageProps {
  /** The `error` code a failed trip to Google left behind, if there was one. */
  authError?: string
}

export function LandingPage({ authError }: LandingPageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />

      <main className="relative isolate grid flex-1 grid-rows-[1fr_auto_4fr] overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(38svh,22rem)] brand-glow"
        />

        <Container className="row-start-2 py-8">
          <Hero authError={authError} />
        </Container>

        {/* Out of the hero's stack, so the reason for the gate reads as a
            separate offer rather than another line of the sign-in group. The
            row's own padding is the whole gap. */}
        <Container className="row-start-3 grid justify-items-center self-start py-8">
          <WhySignIn />
        </Container>
      </main>

      <AppFooter />
    </div>
  )
}

function Hero({ authError }: LandingPageProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto grid max-w-4xl justify-items-center gap-8 text-center"
    >
      <div className="grid gap-4">
        <h1
          id="hero-heading"
          className="font-heading text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
        >
          See which rooms are free,{" "}
          <span className="block text-primary">right now.</span>
        </h1>

        <p className="mx-auto max-w-prose text-sm/relaxed text-muted-foreground">
          Check what&apos;s available, all in one place.
        </p>
      </div>

      {/* The hint belongs to the button, so it stays tucked under it. */}
      <div className="grid w-full max-w-xs justify-items-center gap-2">
        <GoogleSignInButton authError={authError} />

        <p className="text-xs text-muted-foreground">
          For <span className="font-medium text-foreground">@{USC_DOMAIN}</span>{" "}
          accounts only
        </p>
      </div>
    </section>
  )
}
