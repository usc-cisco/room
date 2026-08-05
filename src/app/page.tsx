import { AccountCard } from "@/components/auth/account-card"
import { SignInCard } from "@/components/auth/sign-in-card"
import { getSession } from "@/lib/auth/session"

export default async function Page() {
  const session = await getSession()

  return (
    <main className="grid min-h-svh place-items-center p-6">
      {session ? (
        <AccountCard
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
        />
      ) : (
        <SignInCard />
      )}
    </main>
  )
}
