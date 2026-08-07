"use client"

import { FLOOR_CELLS, GRID_COLUMNS, ROW_TRACKS } from "@/lib/floor-plan/data"
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

/**
 * The floor plate. Every block is placed on one shared 40-column grid so the
 * bands line up on the same vertical edges, exactly as they do on the plan.
 *
 * The plate keeps a fixed minimum width and scrolls horizontally inside its
 * container: a floor plan squeezed to 320px stops being a floor plan.
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
    <div className="grid gap-2">
      <div className="overflow-x-auto overscroll-x-contain">
        <div
          role="group"
          aria-label="Department floor map"
          // The outer wall is a border, not a ring: a ring spreads outside the
          // border box and the scroll container clips it away at both edges.
          className="grid min-w-[38rem] gap-1 border border-foreground/25 bg-background p-2.5 sm:p-3"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
            gridTemplateRows: ROW_TRACKS.join(" "),
          }}
        >
          <OccupancyKey />

          {FLOOR_CELLS.map((cell) => {
            const style = {
              gridColumn: `${cell.col} / span ${cell.span}`,
              gridRow: `${cell.row} / span ${cell.rowSpan ?? 1}`,
            }

            if (cell.kind === "stack" && cell.children) {
              return (
                <div
                  key={cell.id}
                  className="flex flex-col gap-1"
                  style={style}
                >
                  {cell.children.map((child) => (
                    <MapCell
                      key={child.id}
                      space={child}
                      occupied={occupiedIds.has(child.id)}
                      selected={child.id === selectedId}
                      state={stateFor(child)}
                      onSelect={onSelect}
                      className="flex-1"
                    />
                  ))}
                </div>
              )
            }

            return (
              <MapCell
                key={cell.id}
                space={cell}
                occupied={occupiedIds.has(cell.id)}
                selected={cell.id === selectedId}
                state={stateFor(cell)}
                onSelect={onSelect}
                style={style}
              />
            )
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {/* The plate keeps a fixed minimum width, so on a phone it always
            overflows. Say so, rather than leaving half the floor undiscovered. */}
        <span className="lg:hidden">
          Scroll the map sideways to see the whole floor.{" "}
        </span>
        Map not drawn to scale.
      </p>
    </div>
  )
}

/**
 * Says what the red tint means.
 *
 * Sits in the plate's north-west corner, which no room occupies — the west wing
 * starts two tracks lower and the north rooms eight columns east — so it costs
 * no space and scrolls with the plan rather than floating over it.
 */
function OccupancyKey() {
  return (
    <div
      className="flex items-center gap-1.5 place-self-start"
      style={{ gridColumn: "1 / span 8", gridRow: "1" }}
    >
      {/* Same tokens as an occupied cell, so the key and the thing it explains
          cannot drift apart. */}
      <span
        aria-hidden="true"
        className="size-3 shrink-0 bg-destructive/10 ring-1 ring-destructive/40"
      />
      <span className="text-[0.625rem] leading-tight text-muted-foreground">
        In use now
      </span>
    </div>
  )
}
