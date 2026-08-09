"use client"

import {
  FLOOR_CELLS,
  GRID_COLUMNS,
  PLATE_ASPECT,
  ROW_TRACKS,
} from "@/lib/floor-plan/data"
import {
  landscapePlacement,
  portraitPlacement,
  PORTRAIT_ASPECT,
  type GridArea,
} from "@/lib/floor-plan/orientation"
import { matchesQuery } from "@/lib/floor-plan/search"
import type { FloorSpace } from "@/lib/floor-plan/types"

import { MapCell, type CellState } from "./map-cell"

interface MapGridProps {
  query: string
  /** Ids of rooms with a class in session right now. */
  occupiedIds: ReadonlySet<string>
  selectedId: string | null
  onSelect: (id: string) => void
}

/** Equal tracks along the plate's 32-column axis, whichever way it is turned. */
const EQUAL_TRACKS = `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`

/**
 * The measured tracks, floored at zero to match `EQUAL_TRACKS`.
 *
 * A bare `fr` track takes `min-content` as its automatic minimum, which once
 * these run *across* the plate would be a label's width rather than its height.
 * Cells carry `min-w-0` already, so nothing overflows without this — it keeps
 * the plate's fit from resting on that, on the axis where it would show.
 */
const MEASURED_TRACKS = ROW_TRACKS.map((track) => `minmax(0, ${track})`).join(
  " "
)

/** The plate's own custom properties: the same two axes, swapped. */
const PLATE_STYLE = {
  "--plate-columns": EQUAL_TRACKS,
  "--plate-rows": MEASURED_TRACKS,
  "--plate-aspect": `${PLATE_ASPECT.width} / ${PLATE_ASPECT.height}`,
  "--plate-columns-portrait": MEASURED_TRACKS,
  "--plate-rows-portrait": EQUAL_TRACKS,
  "--plate-aspect-portrait": `${PORTRAIT_ASPECT.width} / ${PORTRAIT_ASPECT.height}`,
} as React.CSSProperties

/**
 * Both placements for one block. `.plate-block` in `globals.css` picks the pair
 * that applies, so the orientation switch never reaches JavaScript.
 */
function blockStyle(area: GridArea): React.CSSProperties {
  const landscape = landscapePlacement(area)
  const portrait = portraitPlacement(area)

  return {
    "--block-column": landscape.column,
    "--block-row": landscape.row,
    "--block-column-portrait": portrait.column,
    "--block-row-portrait": portrait.row,
  } as React.CSSProperties
}

/**
 * The floor plate, drawn to the proportions of the posted plan.
 *
 * Both axes are proportional — equal tracks along one, measured `fr` tracks
 * along the other — and the plate holds an aspect ratio, so the two scales stay
 * locked to each other however wide the container gets. The gap is a hairline
 * rather than a full step for the same reason: gaps sit between tracks and so
 * are the one thing on the plate that is not to scale, and a wide one would make
 * the narrow blocks read smaller than they are.
 *
 * Below `md` the plate is turned back to the plan's own north-up orientation.
 * Landscape needs 38rem to stay legible and a phone cannot give it that, and
 * hiding half the floor behind a sideways scroll is worse than turning the map
 * to the shape the screen actually is.
 */
export function MapGrid({
  query,
  occupiedIds,
  selectedId,
  onSelect,
}: MapGridProps) {
  const hasQuery = query.trim().length > 0

  const stateFor = (space: FloorSpace): CellState => {
    if (!hasQuery) return "idle"
    return matchesQuery(space, query) ? "match" : "dimmed"
  }

  return (
    <div className="grid gap-1.5">
      <OccupancyKey />

      <div className="overflow-x-auto overscroll-x-contain">
        <div
          role="group"
          aria-label="Department floor map"
          // Portrait is a tall shape, so the plate caps its width and centres
          // rather than growing into a very long column on a small tablet.
          //
          // The outer wall is a border, not a ring: a ring spreads outside the
          // border box and the scroll container clips it away at both edges.
          className="plate grid gap-0.5 border border-foreground/25 bg-background p-2.5 max-md:mx-auto max-md:max-w-[26rem] sm:p-3 md:min-w-[38rem]"
          style={PLATE_STYLE}
        >
          {FLOOR_CELLS.map((cell) => (
            <MapCell
              key={cell.id}
              space={cell}
              occupied={occupiedIds.has(cell.id)}
              selected={cell.id === selectedId}
              state={stateFor(cell)}
              onSelect={onSelect}
              className="plate-block"
              style={blockStyle(cell)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Says what the red tint means.
 *
 * Sits above the plate rather than in it: it is a note about the drawing, not
 * part of the floor, and outside the plate it neither has to find a corner that
 * is open ground in both orientations nor scales down with the blocks.
 */
function OccupancyKey() {
  return (
    // Held to the plate's own measure below `md`, where the plate centres
    // itself, so the key starts on the same edge as the drawing it explains.
    <div className="flex items-center gap-1.5 max-md:mx-auto max-md:w-full max-md:max-w-[26rem]">
      {/* Same tokens as an occupied cell, so the key and the thing it explains
          cannot drift apart. */}
      <span
        aria-hidden="true"
        className="size-3 shrink-0 bg-destructive/10 ring-1 ring-destructive/40"
      />
      <span className="text-xs leading-tight text-muted-foreground">
        In use now
      </span>
    </div>
  )
}
