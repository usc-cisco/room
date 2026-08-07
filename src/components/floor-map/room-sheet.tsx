"use client"

import { useEffect, useState } from "react"
import { CalendarOff } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { ClassRoom } from "@/lib/floor-plan/types"
import {
  dayName,
  formatTimeRange,
  isCurrent,
  minutesOfDay,
} from "@/lib/schedules/format"
import type { RoomSchedule } from "@/lib/schedules/types"
import { cn } from "@/lib/utils"

/** How often the "Now" marker is re-checked while the sheet stays open. */
const TICK_MS = 60_000

interface RoomSheetProps {
  room: ClassRoom | null
  /** Every meeting in this room, all days. Filtered to today here. */
  schedules: readonly RoomSchedule[]
  onOpenChange: (open: boolean) => void
}

export function RoomSheet({ room, schedules, onOpenChange }: RoomSheetProps) {
  return (
    <Sheet open={room !== null} onOpenChange={onOpenChange}>
      {/* Deliberately narrower than the viewport on a phone: the map staying
          visible alongside is what keeps this reading as a panel over the
          floor rather than a page you navigated to. The width utility carries
          the `data-[side=right]` prefix so it beats the component's own
          default on specificity, not just on order. */}
      <SheetContent
        side="right"
        className="gap-0 data-[side=right]:w-[85%] data-[side=right]:sm:max-w-md"
      >
        {/* Radix mounts this only once the sheet opens, which cannot happen
            before a click. Reading the clock below is therefore safe: it never
            runs during the server render, so there is nothing to mismatch. */}
        {room ? <RoomDay room={room} schedules={schedules} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function RoomDay({
  room,
  schedules,
}: {
  room: ClassRoom
  schedules: readonly RoomSchedule[]
}) {
  const [now, setNow] = useState(() => new Date())

  // Keeps the "Now" marker honest if the sheet is left open across a class
  // changeover. Only runs while the sheet is mounted.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const today = now.getDay()
  const minutes = minutesOfDay(now)
  const todays = schedules.filter((entry) => entry.dayOfWeek === today)

  const label = room.code ?? room.name ?? "Room"
  const subtitle = room.code && room.name ? `${room.name} · ` : ""

  return (
    <>
      <SheetHeader className="border-b">
        {/* Mono suits a room code; a room's name is prose and should not be
            set in it. */}
        <SheetTitle className={cn("text-base", room.code && "font-mono")}>
          {label}
        </SheetTitle>
        <SheetDescription>
          {subtitle}
          {dayName(today)}
          {todays.length > 0 &&
            ` · ${todays.length} ${todays.length === 1 ? "class" : "classes"}`}
        </SheetDescription>
      </SheetHeader>

      {todays.length === 0 ? (
        <EmptyDay today={today} />
      ) : (
        <ol className="flex-1 divide-y overflow-y-auto">
          {todays.map((entry) => (
            <ClassRow
              key={entry.id}
              entry={entry}
              current={isCurrent(entry, today, minutes)}
            />
          ))}
        </ol>
      )}
    </>
  )
}

/**
 * Shown when a teaching room has nothing on today. Only teaching rooms reach
 * this — comfort rooms and facilities never open a sheet at all — so an empty
 * day here is useful news rather than a missing timetable.
 */
function EmptyDay({ today }: { today: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      {/* Square, not a circle: it echoes a room on the plate, and the rest of
          the system is uniformly rounded-none. */}
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center border border-border bg-muted/40"
      >
        <CalendarOff className="size-5 text-muted-foreground" />
      </span>

      <div className="grid gap-1">
        <p className="text-sm font-medium">Free all day</p>
        <p className="text-xs/relaxed text-balance text-muted-foreground">
          Nothing is scheduled here on {dayName(today)}.
        </p>
      </div>
    </div>
  )
}

function ClassRow({
  entry,
  current,
}: {
  entry: RoomSchedule
  current: boolean
}) {
  return (
    <li
      className={cn(
        "grid gap-1 border-l-2 p-4",
        current ? "border-l-primary bg-primary/5" : "border-l-transparent"
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "font-mono text-xs",
            current ? "font-medium text-primary" : "text-muted-foreground"
          )}
        >
          {formatTimeRange(entry.startTime, entry.endTime)}
        </span>

        {current ? (
          <span className="shrink-0 bg-primary px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-primary-foreground uppercase">
            Now
          </span>
        ) : null}
      </div>

      <p className="text-sm font-medium">{entry.courseDescription}</p>

      <p className="text-xs text-muted-foreground">
        <span className="font-mono">{entry.courseCode}</span> · {entry.group} ·{" "}
        {entry.program}
      </p>
    </li>
  )
}
