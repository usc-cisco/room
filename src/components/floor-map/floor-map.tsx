"use client"

import { useCallback, useMemo, useState } from "react"

import { useHydrated } from "@/hooks/use-hydrated"
import { useNow } from "@/hooks/use-now"
import { CLASS_ROOMS } from "@/lib/floor-plan/data"
import { findRooms } from "@/lib/floor-plan/search"
import { minutesOfDay } from "@/lib/schedules/format"
import { occupiedRoomIds } from "@/lib/schedules/occupancy"
import type { RoomScheduleMap } from "@/lib/schedules/types"

import { CurrentTime } from "./current-time"
import { MapGrid } from "./map-grid"
import { RoomSearch } from "./room-search"
import { RoomSheet } from "./room-sheet"

interface FloorMapProps {
  /** Every meeting on the floor, all days, keyed by room id. */
  schedulesByRoom: RoomScheduleMap
}

const NO_ROOMS: ReadonlySet<string> = new Set()

/**
 * The department floor map: the one screen the app exists for.
 *
 * It owns the page's clock along with the two pieces of view state — the search
 * query and the selected room — and hands them down; every other piece of the
 * map is presentational. One clock rather than one per component, so the
 * heading, the occupancy tint and the sheet cannot disagree at a changeover.
 */
export function FloorMap({ schedulesByRoom }: FloorMapProps) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const now = useNow()

  const matches = useMemo(() => findRooms(query), [query])

  // The tint is held back until after hydration. The server's clock and the
  // browser's can legitimately differ, and unlike the heading — where one
  // `suppressHydrationWarning` covers it — a mismatch here would land on the
  // className of every cell on the plate.
  const hydrated = useHydrated()

  const occupiedIds = useMemo(
    () =>
      hydrated
        ? occupiedRoomIds(schedulesByRoom, now.getDay(), minutesOfDay(now))
        : NO_ROOMS,
    [hydrated, schedulesByRoom, now]
  )

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
    <section aria-label="Floor map" className="grid gap-5">
      <CurrentTime now={now} />

      <div className="grid min-w-0 gap-3">
        <RoomSearch
          query={query}
          onQueryChange={setQuery}
          matchCount={matches.length}
          className="sm:max-w-xs"
        />
        <MapGrid
          query={query}
          occupiedIds={occupiedIds}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      <RoomSheet
        room={selectedRoom}
        now={now}
        schedules={selectedId ? (schedulesByRoom[selectedId] ?? []) : []}
        onOpenChange={handleOpenChange}
      />
    </section>
  )
}
