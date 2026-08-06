"use client"

import { useId } from "react"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface RoomSearchProps {
  query: string
  onQueryChange: (query: string) => void
  matchCount: number
  className?: string
}

/** Search by room code or name. The match count is announced politely so the
 * result of typing is available without looking at the plate. */
export function RoomSearch({
  query,
  onQueryChange,
  matchCount,
  className,
}: RoomSearchProps) {
  const inputId = useId()
  const hasQuery = query.trim().length > 0

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={inputId} className="sr-only">
        Search rooms
      </label>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={inputId}
          type="search"
          value={query}
          placeholder="Search a room, e.g. LB445"
          autoComplete="off"
          onChange={(event) => onQueryChange(event.target.value)}
          className="px-8 [&::-webkit-search-cancel-button]:hidden"
        />
        {hasQuery ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => onQueryChange("")}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <X />
          </Button>
        ) : null}
      </div>

      <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
        {hasQuery
          ? `${matchCount} ${matchCount === 1 ? "room" : "rooms"} found`
          : null}
      </p>
    </div>
  )
}
