"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { signIn } from "@/lib/auth/client"

import { GoogleIcon } from "./google-icon"
import { SignInFailedDialog } from "./sign-in-failed-dialog"

/** Stands in for a failure that never reached the callback at all. */
const REQUEST_FAILED = "request_failed"

interface GoogleSignInButtonProps {
  /** Where to land after Google redirects back. */
  callbackURL?: string
  /**
   * The `error` code Google's callback left in the URL, read on the server. Its
   * arrival is the only signal that a previous attempt failed.
   */
  authError?: string
}

export function GoogleSignInButton({
  callbackURL = "/",
  authError,
}: GoogleSignInButtonProps) {
  const [isPending, setIsPending] = useState(false)
  // The parameter is read once, at mount: it describes the trip that just
  // ended, so nothing later in this page's life should reopen it.
  const [failure, setFailure] = useState<string | null>(authError ?? null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Having shown the reason, take it out of the URL so a refresh or a shared
  // link does not replay the bad news. `replaceState` rather than
  // `router.replace` on purpose: this tidies the address bar and should not
  // cost a round trip to the server.
  useEffect(() => {
    if (!authError) {
      return
    }

    const url = new URL(window.location.href)
    url.searchParams.delete("error")
    url.searchParams.delete("error_description")
    window.history.replaceState(null, "", url)
  }, [authError])

  async function handleSignIn() {
    setIsPending(true)
    setFailure(null)

    try {
      const { error: signInError } = await signIn.social({
        provider: "google",
        callbackURL,
        // Without this the callback's own failures land on better-auth's error
        // page, which in production bounces to `/` with nothing reading it.
        // Point them back here instead, where the dialog below is waiting.
        errorCallbackURL: callbackURL,
      })

      // On success the browser is already navigating to Google, so we
      // deliberately leave the button in its pending state.
      if (signInError) {
        setFailure(REQUEST_FAILED)
        setIsPending(false)
      }
    } catch {
      // A dropped connection rejects rather than resolving with an error, so
      // without this the button would sit on "Redirecting to Google…" forever
      // while the rejection went unhandled.
      setFailure(REQUEST_FAILED)
      setIsPending(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setFailure(null)
    }
  }

  // Radix restores focus to whatever opened the dialog, but when it opened from
  // the URL that is nothing at all and focus falls to the body. Take it over and
  // hand focus to the button they need next either way.
  function handleCloseAutoFocus(event: Event) {
    event.preventDefault()
    buttonRef.current?.focus()
  }

  return (
    <>
      <Button
        ref={buttonRef}
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

      <SignInFailedDialog
        code={failure}
        onOpenChange={handleOpenChange}
        onCloseAutoFocus={handleCloseAutoFocus}
      />
    </>
  )
}
