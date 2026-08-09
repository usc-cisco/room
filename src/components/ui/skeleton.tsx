import { cn } from "@/lib/utils"

/**
 * A placeholder for content that has not arrived.
 *
 * Square like everything else in the system, and hidden from assistive tech:
 * a screen reader gains nothing from a dozen unnamed boxes, and the page it is
 * standing in for announces itself as it loads.
 *
 * The pulse is `motion-safe` so a reader who has asked for less motion gets a
 * still block rather than a breathing one.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "rounded-none bg-muted motion-safe:animate-pulse",
        className
      )}
      {...props}
    />
  )
}
