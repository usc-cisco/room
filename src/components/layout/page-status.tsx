import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface PageStatusProps {
  icon: LucideIcon
  title: string
  description: React.ReactNode
  /** Buttons or links out of here. A dead end with no way on is not a page. */
  children?: React.ReactNode
  /** Detail worth showing but not worth reading first, e.g. an error digest. */
  footnote?: React.ReactNode
  className?: string
}

/**
 * The shape every whole-page state takes: not found, and the two error
 * boundaries.
 *
 * One component so those three cannot drift into three different apologies,
 * and so they read as the same product as the empty states inside the sheets —
 * square icon plate, a line of what happened, a line of what to do.
 */
export function PageStatus({
  icon: Icon,
  title,
  description,
  children,
  footnote,
  className,
}: PageStatusProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-sm flex-col items-center gap-5 text-center",
        className
      )}
    >
      {/* Square, not a circle: it echoes a room on the plate. */}
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center border border-border bg-muted/40"
      >
        <Icon className="size-5 text-muted-foreground" />
      </span>

      <div className="grid gap-1.5">
        <h1 className="font-heading text-base font-medium">{title}</h1>
        <p className="text-xs/relaxed text-balance text-muted-foreground">
          {description}
        </p>
      </div>

      {children ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      ) : null}

      {footnote ? (
        <p className="font-mono text-[0.625rem] break-all text-muted-foreground/70">
          {footnote}
        </p>
      ) : null}
    </div>
  )
}
