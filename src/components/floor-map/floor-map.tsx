"use client"

import { useCallback, useMemo, useState } from "react"

import { CLASS_ROOMS } from "@/lib/floor-plan/data"
import { findRooms } from "@/lib/floor-plan/search"
import type { RoomScheduleMap } from "@/lib/schedules/types"

import { MapGrid } from "./map-grid"
import { RoomSearch } from "./room-search"
import { RoomSheet } from "./room-sheet"

interface FloorMapProps {
  /** Every meeting on the floor, all days, keyed by room id. */
  schedulesByRoom: RoomScheduleMap
}

/**
 * The department floor map: the one screen the app exists for. It owns the two
 * pieces of view state — the search query and the selected room — and hands
 * them down; every other piece of the map is presentational.
 */
export function FloorMap({ schedulesByRoom }: FloorMapProps) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const matches = useMemo(() => findRooms(query), [query])

  // Only teaching rooms resolve to a selection, so nothing else can open the
  // sheet even if an id somehow reached this state.
  const selectedRoom = useMemo(
    () => CLASS_ROOMS.find((room) => room.id === selectedId) ?? null,
    [selectedId]
  )

  // Selecting the same room again toggles it off, which keeps the plate itself
  // a way out of a selection rather than a one-way door.
  const handleSelect = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }, [])

  // Escape and overlay clicks come through here — the sheet handles both, so
  // the map needs no key listener of its own.
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) setSelectedId(null)
  }, [])

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

      <RoomSheet
        room={selectedRoom}
        schedules={selectedId ? (schedulesByRoom[selectedId] ?? []) : []}
        onOpenChange={handleOpenChange}
      />
    </section>
  )
}
