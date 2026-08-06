import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Shared width and gutters for every band of the shell, so the logo, content,
 * and credits all sit on the same vertical edges at any viewport.
 *
 * Wide enough for the floor map, which is the widest thing the app shows and
 * caps itself at a narrower measure than this.
 */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  )
}
