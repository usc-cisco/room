"use client"

import { cva } from "class-variance-authority"

import type { FloorSpace } from "@/lib/floor-plan/types"
import { cn } from "@/lib/utils"

const cellVariants = cva(
  // A size container, so a label can be fitted to the block it sits in rather
  // than to the plate: the same block is wide and shallow in one orientation
  // and narrow and deep in the other. Containment costs nothing here — every
  // block is sized by its grid track or its flex weight, so its contents never
  // contributed to its size to begin with.
  "[container-type:size] relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-none px-px text-center outline-none motion-safe:transition-[opacity,box-shadow,transform,background-color] motion-safe:duration-150 md:px-1",
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
        //
        // The ring is how the spines join the bands they meet. Grid gaps are
        // the plan's walls, but two corridors meeting have no wall between
        // them, and a slit of page showing through read as one. A ring spreads
        // outside the border box without taking part in layout, so half a gap
        // of corridor on each side closes the seam and nothing on the plate
        // moves.
        corridor: "bg-map-corridor ring-1 ring-map-corridor",
        excluded: "hatch ring-1 ring-border",
      },
      // Declared after `kind` so it overrides the room surface, and before
      // `selected`/`state` so both of those still win over it.
      occupied: {
        true: "bg-destructive/10 text-destructive ring-1 ring-destructive/40",
        false: "",
      },
      // Out of service: muted with a dashed edge, apart from both "in use" and
      // the excluded hatch.
      closed: {
        true: "bg-muted text-muted-foreground ring-0 outline-1 -outline-offset-1 outline-muted-foreground/50 outline-dashed",
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
    defaultVariants: {
      occupied: false,
      closed: false,
      selected: false,
      state: "idle",
    },
  }
)

export type CellState = "idle" | "match" | "dimmed"

interface MapCellProps {
  space: FloorSpace
  /** A class is in session in this room right now. */
  occupied?: boolean
  /** The room is out of service, e.g. under renovation. */
  closed?: boolean
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
  closed = false,
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
      closed,
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
      {closed ? <ClosedLabel /> : null}
    </button>
  )
}

/** The word a closed room carries under its code. */
function ClosedLabel() {
  return (
    <>
      <span
        aria-hidden="true"
        className="plate-label mt-0.5 max-w-full leading-tight opacity-70 [--label-advance:0.58]"
        style={{ "--label-chars": 10 } as React.CSSProperties}
      >
        Renovation
      </span>
      <span className="sr-only">Under renovation</span>
    </>
  )
}

/** Characters in the longest word — the width a wrapping name has to fit. */
function longestWord(name: string): number {
  return name
    .split(/\s+/)
    .reduce((longest, word) => Math.max(longest, word.length), 0)
}

/** The code and/or name a space shows on the plate. */
function SpaceLabel({ space }: { space: FloorSpace }) {
  return (
    <>
      {space.code ? (
        <span
          // A code is one token, never broken across lines: it shrinks to the
          // block instead, and turns with it when the block is too narrow for
          // any size to fit.
          className="plate-label max-w-full font-mono font-medium tracking-tight whitespace-nowrap [--label-advance:0.66] [--label-size:0.625rem] md:[--label-size:0.75rem]"
          style={{ "--label-chars": space.code.length } as React.CSSProperties}
        >
          {space.code}
        </span>
      ) : null}
      {space.name ? (
        <span
          className={cn(
            // A name is prose: it wraps between words, so only its longest word
            // has to fit across. Breaking inside a word is left off for that
            // reason — `Contro` over `l Room` is worse than a smaller label.
            "plate-label max-w-full leading-tight text-balance [--label-advance:0.58]",
            space.code && "mt-0.5 opacity-70"
          )}
          style={
            { "--label-chars": longestWord(space.name) } as React.CSSProperties
          }
        >
          {space.name}
        </span>
      ) : null}
    </>
  )
}
