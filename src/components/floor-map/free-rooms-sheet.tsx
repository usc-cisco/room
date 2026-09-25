"use client"

import { CalendarOff } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CLASS_ROOMS, ROOM_STATUS_LABEL } from "@/lib/floor-plan/data"
import {
  freeWindows,
  teachingDay,
  type TimeWindow,
} from "@/lib/schedules/availability"
import {
  dayName,
  formatTime,
  formatTimeRange,
  minutesOfDay,
} from "@/lib/schedules/format"
import type { RoomScheduleMap } from "@/lib/schedules/types"
import { cn } from "@/lib/utils"

interface FreeRoomsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Every meeting on the floor, all days, keyed by room id. */
  schedulesByRoom: RoomScheduleMap
  /** The page's clock, so this and the map agree on "now". */
  now: Date
  onSelectRoom: (id: string) => void
}

/**
 * The whole floor's free time in one list.
 *
 * The plate says what is busy this minute and a room sheet says what one room
 * is doing all day; neither answers "where can I go?" without opening rooms one
 * at a time. Every teaching room gets a row here, in plan order, so the answer
 * is a glance rather than a search.
 */
export function FreeRoomsSheet({
  open,
  onOpenChange,
  schedulesByRoom,
  now,
  onSelectRoom,
}: FreeRoomsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Same measure as the room sheet: the two are the same kind of panel and
          should not resize under the reader as they move between them. */}
      <SheetContent
        side="right"
        className="gap-0 data-[side=right]:w-[85%] data-[side=right]:sm:max-w-md"
      >
        {/* Radix mounts this only once the sheet opens, so reading the clock
            here never runs during the server render and cannot mismatch. */}
        {open ? (
          <FreeRooms
            schedulesByRoom={schedulesByRoom}
            now={now}
            onSelectRoom={onSelectRoom}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function FreeRooms({
  schedulesByRoom,
  now,
  onSelectRoom,
}: {
  schedulesByRoom: RoomScheduleMap
  now: Date
  onSelectRoom: (id: string) => void
}) {
  const today = now.getDay()
  const minutes = minutesOfDay(now)
  const day = teachingDay(schedulesByRoom, today)

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle className="text-base">Free rooms</SheetTitle>
        <SheetDescription>
          {dayName(today)}
          {day ? ` · ${formatTimeRange(day.startTime, day.endTime)}` : null}
        </SheetDescription>
      </SheetHeader>

      {day === null ? (
        <EmptyFloor today={today} />
      ) : (
        <ol className="flex-1 divide-y overflow-y-auto">
          {CLASS_ROOMS.map((room) => (
            <RoomRow
              key={room.id}
              code={room.code ?? room.id}
              closedLabel={room.status ? ROOM_STATUS_LABEL[room.status] : null}
              windows={freeWindows(schedulesByRoom[room.id] ?? [], today, day)}
              day={day}
              minutes={minutes}
              onSelect={() => onSelectRoom(room.id)}
            />
          ))}
        </ol>
      )}
    </>
  )
}

/**
 * One room's free time.
 *
 * A room with none keeps its row rather than dropping out of the list: the
 * point of the view is the whole floor at a glance, and a room that is simply
 * missing reads the same as one that does not exist.
 */
function RoomRow({
  code,
  closedLabel,
  windows,
  day,
  minutes,
  onSelect,
}: {
  code: string
  /** Set when the room is out of service; shown instead of its free time. */
  closedLabel: string | null
  windows: readonly TimeWindow[]
  day: TimeWindow
  minutes: number
  onSelect: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-baseline gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
      >
        {/* The row's heading, so it takes the size a class takes in the room
            sheet — `text-sm font-medium` — with the times below it at `text-xs`
            as they are there. The two sheets are read one after the other and
            should not change scale under the reader. */}
        <span className="w-16 shrink-0 font-mono text-sm font-medium">
          {code}
        </span>

        {closedLabel ? (
          <span className="text-xs text-muted-foreground">{closedLabel}</span>
        ) : windows.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            No free time today
          </span>
        ) : (
          <span className="grid min-w-0 gap-0.5">
            {windows.map((window) => (
              <WindowLine
                key={window.startTime + window.endTime}
                window={window}
                day={day}
                minutes={minutes}
              />
            ))}
          </span>
        )}
      </button>
    </li>
  )
}

/**
 * One free stretch.
 *
 * The day's own edges are written as `until` and `from` rather than as a range:
 * the floor's opening and closing times are not a booking, and printing them as
 * one end of a range would suggest the room turns busy at 5:30 PM.
 */
function WindowLine({
  window,
  day,
  minutes,
}: {
  window: TimeWindow
  day: TimeWindow
  minutes: number
}) {
  const now = window.start <= minutes && minutes < window.end
  const opensDay = window.start <= day.start
  const closesDay = window.end >= day.end

  const label =
    opensDay && closesDay
      ? "Free all day"
      : opensDay
        ? `until ${formatTime(window.endTime)}`
        : closesDay
          ? `from ${formatTime(window.startTime)}`
          : formatTimeRange(window.startTime, window.endTime)

  return (
    <span
      className={cn(
        "font-mono text-xs",
        now ? "font-medium text-primary" : "text-muted-foreground"
      )}
    >
      {label}
      {now ? <span className="ml-1.5 font-sans">· now</span> : null}
    </span>
  )
}

/** Shown on a day the floor has no classes at all — a weekend, or a holiday. */
function EmptyFloor({ today }: { today: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center border border-border bg-muted/40"
      >
        <CalendarOff className="size-5 text-muted-foreground" />
      </span>

      <div className="grid gap-1">
        <p className="text-sm font-medium">Every room is free</p>
        <p className="text-xs/relaxed text-balance text-muted-foreground">
          Nothing is scheduled anywhere on the floor on {dayName(today)}.
        </p>
      </div>
    </div>
  )
}
