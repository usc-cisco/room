"use client"

import { Lock } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Fact {
  term: string
  detail: string
}

/** Both are checkable: Google is the only provider configured, the user table
 *  holds name, email and image, and OAuth never puts the password in our
 *  hands. */
const FACTS: readonly Fact[] = [
  {
    term: "What Google tells us",
    detail:
      "Your name, email address, and profile picture. We don’t receive or store your Google password.",
  },
  {
    term: "Signing out",
    detail: "Sign out from the menu in the top corner whenever you like.",
  },
]

/** The reason for the gate, one click away rather than in the reader's path. */
export function WhySignIn() {
  return (
    <Dialog>
      {/* Radix's Root renders no element, so this button is a direct child of
          the hero's grid and takes its placement from there. */}
      <DialogTrigger className="text-xs text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground focus-visible:rounded-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Why do I have to sign in?
      </DialogTrigger>

      <DialogContent className="gap-5 p-5 sm:max-w-md">
        <DialogHeader className="gap-3">
          {/* The square plate `PageStatus` uses. */}
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center border border-border bg-muted/40"
          >
            <Lock className="size-5 text-muted-foreground" />
          </span>

          <div className="grid gap-1.5">
            <DialogTitle>Why you have to sign in</DialogTitle>
            <DialogDescription>
              This is for the USC community. Your USC Google account helps us
              make sure access stays within the community.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Shared gridlines, as on the plate: the gap is the wall. */}
        <dl className="grid gap-px border border-border bg-border">
          {FACTS.map(({ term, detail }) => (
            <div key={term} className="grid gap-1 bg-card p-3">
              <dt className="text-xs font-medium">{term}</dt>
              <dd className="text-xs/relaxed text-muted-foreground">
                {detail}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
