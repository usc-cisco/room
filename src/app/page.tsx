import { SignInCard } from "@/components/auth/sign-in-card"
import { AppFooter } from "@/components/layout/app-footer"
import { AppHeader } from "@/components/layout/app-header"
import { Container } from "@/components/layout/container"
import { getSession } from "@/lib/auth/session"

export default async function Page() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="grid min-h-svh place-items-center p-6">
        <SignInCard />
      </main>
    )
  }

  const { user } = session

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader name={user.name} email={user.email} image={user.image} />

      <main className="flex-1">
        {/* Room availability lands here next pass. */}
        <Container className="py-8 sm:py-12" />
      </main>

      <AppFooter />
    </div>
  )
}
