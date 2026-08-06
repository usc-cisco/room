"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { findRooms } from "@/lib/floor-plan/search"

import { MapGrid } from "./map-grid"
import { RoomSearch } from "./room-search"

/**
 * The department floor map: the one screen the app exists for. It owns the two
 * pieces of view state — the search query and the selected room — and hands
 * them down; every other piece of the map is presentational.
 */
export function FloorMap() {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const matches = useMemo(() => findRooms(query), [query])

  const clearSelection = useCallback(() => setSelectedId(null), [])

  // Selecting the same room again toggles it off, which keeps the plate itself
  // a way out of a selection rather than a one-way door.
  const handleSelect = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }, [])

  useEffect(() => {
    if (!selectedId) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") clearSelection()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedId, clearSelection])

  return (
    <section aria-labelledby="floor-map-heading" className="grid gap-5">
      <header className="grid gap-1">
        <h1 id="floor-map-heading" className="font-heading text-lg font-medium">
          Floor map
        </h1>
        <p className="text-xs text-muted-foreground">
          Find a room in the department.
        </p>
      </header>

      <div className="grid min-w-0 gap-3">
        <RoomSearch
          query={query}
          onQueryChange={setQuery}
          matchCount={matches.length}
          className="sm:max-w-xs"
        />
        <MapGrid
          query={query}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>
    </section>
  )
}
