import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"
import { AppFooter } from "@/components/layout/app-footer"
import { AppHeader } from "@/components/layout/app-header"
import { Container } from "@/components/layout/container"

import { WhySignIn } from "./why-sign-in"

export function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />

      <main className="relative isolate grid flex-1 grid-rows-[1fr_auto_4fr] overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[min(38svh,22rem)] brand-glow"
        />

        <Container className="row-start-2 py-8">
          <Hero />
        </Container>
      </main>

      <AppFooter />
    </div>
  )
}

function Hero() {
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

      <div className="grid justify-items-center gap-3">
        <div className="w-full max-w-xs">
          <GoogleSignInButton />
        </div>

        <WhySignIn />
      </div>
    </section>
  )
}
