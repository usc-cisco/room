"use client"

import { cva } from "class-variance-authority"

import type { FloorSpace } from "@/lib/floor-plan/types"
import { cn } from "@/lib/utils"

const cellVariants = cva(
  "relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-none px-px text-center outline-none motion-safe:transition-[opacity,box-shadow,transform,background-color] motion-safe:duration-150 md:px-1",
  {
    variants: {
      kind: {
        // The only interactive kind, so the only one carrying hover, focus and
        // lift affordances.
        room: "bg-card text-card-foreground ring-1 ring-foreground/12 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-ring motion-safe:hover:-translate-y-px",
        // Labelled but inert: no timetable sits behind either of these, so they
        // deliberately offer nothing to click.
        comfort: "bg-primary/10 text-primary ring-1 ring-primary/25",
        facility: "bg-muted text-muted-foreground ring-1 ring-border",
        // Circulation, not a destination: no border, sits below the page.
        corridor: "bg-map-corridor",
        excluded: "hatch ring-1 ring-border",
        stack: "gap-1 bg-transparent p-0",
      },
      // Declared after `kind` so it overrides the room surface, and before
      // `selected`/`state` so both of those still win over it.
      occupied: {
        true: "bg-destructive/10 text-destructive ring-1 ring-destructive/40",
        false: "",
      },
      selected: {
        true: "z-10 bg-primary text-primary-foreground ring-2 ring-primary",
        false: "",
      },
      state: {
        idle: "",
        match: "z-10 ring-2 ring-primary",
        dimmed: "opacity-35",
      },
    },
    defaultVariants: { occupied: false, selected: false, state: "idle" },
  }
)

export type CellState = "idle" | "match" | "dimmed"

interface MapCellProps {
  space: FloorSpace
  /** A class is in session in this room right now. */
  occupied?: boolean
  selected?: boolean
  state?: CellState
  onSelect?: (id: string) => void
  className?: string
  style?: React.CSSProperties
}

/**
 * One block on the plate.
 *
 * Only teaching rooms are buttons — they are the only spaces with a schedule
 * to open. Comfort rooms and facilities still show their labels and still
 * light up in search, but offer nothing to click and stay out of the tab
 * order. Corridors and excluded floor area are additionally hidden from
 * assistive tech: the legend carries their meaning, and announcing two dozen
 * unnamed shapes would bury the rooms someone is actually tabbing for.
 */
export function MapCell({
  space,
  occupied = false,
  selected = false,
  state = "idle",
  onSelect,
  className,
  style,
}: MapCellProps) {
  const classes = cn(
    cellVariants({
      kind: space.kind,
      occupied,
      selected,
      state: selected ? "idle" : state,
    }),
    className
  )

  if (space.kind === "corridor" || space.kind === "excluded") {
    return <div aria-hidden="true" className={classes} style={style} />
  }

  const isComfort = space.kind === "comfort"
  const label = isComfort ? (
    <>
      <span aria-hidden="true" className="font-mono text-[0.625rem]">
        CR
      </span>
      <span className="sr-only">Comfort Room</span>
    </>
  ) : (
    <SpaceLabel space={space} />
  )

  if (space.kind !== "room") {
    return (
      <div className={classes} style={style}>
        {label}
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(space.id)}
      className={classes}
      style={style}
    >
      {label}
      {/* The tint alone would leave this state invisible to anyone who cannot
          see the colour, and unreachable by assistive tech. */}
      {occupied ? <span className="sr-only">In use</span> : null}
    </button>
  )
}

/** The code and/or name a space shows on the plate. */
function SpaceLabel({ space }: { space: FloorSpace }) {
  return (
    <>
      {space.code ? (
        <span className="max-w-full font-mono text-[0.625rem] font-medium tracking-tight break-all md:text-xs">
          {space.code}
        </span>
      ) : null}
      {space.name ? (
        <span
          className={cn(
            "max-w-full text-[0.625rem] leading-tight text-balance break-words",
            space.code && "mt-0.5 opacity-70"
          )}
        >
          {space.name}
        </span>
      ) : null}
    </>
  )
}
