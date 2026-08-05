"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { signIn } from "@/lib/auth/client"

import { GoogleIcon } from "./google-icon"

interface GoogleSignInButtonProps {
  /** Where to land after Google redirects back. */
  callbackURL?: string
}

export function GoogleSignInButton({
  callbackURL = "/",
}: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setIsPending(true)
    setError(null)

    const { error: signInError } = await signIn.social({
      provider: "google",
      callbackURL,
    })

    // On success the browser is already navigating to Google, so we
    // deliberately leave the button in its pending state.
    if (signInError) {
      setError(signInError.message ?? "Could not reach Google. Try again.")
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleSignIn}
        disabled={isPending}
        aria-busy={isPending}
      >
        <GoogleIcon />
        {isPending ? "Redirecting to Google…" : "Continue with Google"}
      </Button>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
