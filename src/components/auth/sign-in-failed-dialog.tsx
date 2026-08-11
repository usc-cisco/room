"use client"

import { CloudOff, Undo2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Copy {
  icon: typeof CloudOff
  title: string
  description: string
  /** Second paragraph, for the part that needs explaining rather than stating. */
  detail?: string
}

/** Google's own answer when the reader presses Cancel on the consent screen. */
const CANCELLED_CODE = "access_denied"

/**
 * Nothing broke here, so the copy says nothing about servers. The reader knows
 * what they did; they only need the door to still be open.
 */
const CANCELLED: Copy = {
  icon: Undo2,
  title: "Sign-in cancelled",
  description:
    "You came back from Google without finishing. Nothing happened and nothing was saved.",
}

/**
 * Every other way the round trip can end: the token exchange this server has to
 * make with Google failed, the state went stale, or the first request never left
 * the browser. The reader cannot tell those apart and cannot act on the
 * difference, so they get one explanation rather than a taxonomy.
 */
const UNREACHABLE: Copy = {
  icon: CloudOff,
  title: "Sign-in couldn’t finish",
  description:
    "This site could not reach Google to finish signing you in. Nothing was saved and you are not signed in.",
  detail:
    "This usually happens in the evenings, when the server this site runs on stops allowing outgoing requests. If it is late, try again in the morning.",
}

interface SignInFailedDialogProps {
  /**
   * The error code from the callback, or `null` when there is nothing to say.
   * Doubles as the open state so the copy can never lag behind the reason.
   */
  code: string | null
  onOpenChange: (open: boolean) => void
  /**
   * Where focus should land on close. Needed because this dialog can open
   * without a click — from a URL parameter on load — so Radix has no trigger to
   * restore focus to and would otherwise drop it on the body.
   */
  onCloseAutoFocus?: (event: Event) => void
}

/**
 * Controlled and trigger-less, like `SignOutDialog`: it opens from a URL
 * parameter on load or from a failed request, never from a click of its own.
 */
export function SignInFailedDialog({
  code,
  onOpenChange,
  onCloseAutoFocus,
}: SignInFailedDialogProps) {
  const copy = code === CANCELLED_CODE ? CANCELLED : UNREACHABLE
  const Icon = copy.icon

  return (
    <Dialog open={code !== null} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-5 p-5 sm:max-w-md"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader className="gap-3">
          {/* The square plate `PageStatus` and `WhySignIn` both use. */}
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center border border-border bg-muted/40"
          >
            <Icon className="size-5 text-muted-foreground" />
          </span>

          <div className="grid gap-1.5">
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </div>
        </DialogHeader>

        {copy.detail ? (
          <p className="border border-border bg-card p-3 text-xs/relaxed text-muted-foreground">
            {copy.detail}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
