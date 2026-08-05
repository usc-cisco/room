"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth/client"

export function SignOutButton() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut() {
    setIsPending(true)
    setError(null)

    const { error: signOutError } = await signOut()

    if (signOutError) {
      setError(signOutError.message ?? "Could not sign out. Try again.")
      setIsPending(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="destructive"
        size="lg"
        className="w-full"
        onClick={handleSignOut}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? "Signing out…" : "Sign out"}
      </Button>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
