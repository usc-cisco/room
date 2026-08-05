"use client"

import { useRouter } from "next/navigation"
import { useState, type MouseEvent } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { signOut } from "@/lib/auth/client"

interface SignOutDialogProps {
  email: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Controlled and trigger-less on purpose: it is rendered as a sibling of the
 * user popover rather than inside it. Nesting it would let the popover unmount
 * the dialog as focus moves, and the two focus traps would fight.
 */
export function SignOutDialog({
  email,
  open,
  onOpenChange,
}: SignOutDialogProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()

    setIsPending(true)
    setError(null)

    const { error: signOutError } = await signOut()

    if (signOutError) {
      setError(signOutError.message ?? "Could not sign out. Try again.")
      setIsPending(false)
      return
    }

    onOpenChange(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            You&rsquo;ll be signed out of {email} and will need to sign in with
            Google again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleSignOut}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? "Signing out…" : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
