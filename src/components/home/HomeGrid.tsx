"use client";

/**
 * The grid: a wall of apertures onto the work.
 *
 * Every cell is a window onto a different frame, cropped to a different part
 * of it, so the wall is never the same picture twice — it is the whole body of
 * work seen through eighty small holes. Some cells are bigger than others, set
 * once and deterministically, so the wall has a composition rather than a
 * texture. Hovering opens a cell further.
 *
 * Each one is a real link to its project, which is what makes the grid a way
 * in rather than a decoration: it opens the project the way everything else
 * does, it works without JavaScript, and a crawler can read the whole line off
 * the home page.
 *
 * Everything is derived from the tile's index, so the server and the client
 * agree and nothing shifts under the pointer on hydration.
 */
import type { GridTile } from "@/sanity/load-grid";

/** xorshift32, the same deterministic noise the Poster and the field use. */
function noise(n: number) {
  let x = (n | 0) || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967296;
}

/** How many cells to lay. Enough that the wall reads as a field, not a gallery. */
const CELLS = 96;

type Cell = {
  tile: GridTile;
  /** 1, 2 or 3 columns and rows. A few large ones carry the composition. */
  span: number;
  /** Where in the frame this window looks. */
  posX: number;
  posY: number;
};

function layout(tiles: GridTile[]): Cell[] {
  if (!tiles.length) return [];
  const cells: Cell[] = [];
  for (let i = 0; i < CELLS; i++) {
    const r = noise(i * 2654435761 + 17);
    // Most stay dots. A handful open up, and the big ones are rare enough to
    // read as events rather than as a pattern.
    const span = r > 0.955 ? 3 : r > 0.84 ? 2 : 1;
    cells.push({
      // Walk the pool rather than sampling it, so every frame gets used before
      // any frame repeats.
      tile: tiles[i % tiles.length],
      span,
      posX: Math.round(noise(i * 40503 + 7) * 100),
      posY: Math.round(noise(i * 86969 + 3) * 100),
    });
  }
  return cells;
}

export function HomeGrid({ tiles }: { tiles: GridTile[] }) {
  const cells = layout(tiles);
  if (!cells.length) return null;

  return (
    <nav className="hbw-grid" aria-label="Work">
      {cells.map((cell, i) => (
        <a
          key={i}
          className="hbw-grid__cell"
          href={`/projects/${cell.tile.slug}`}
          style={
            {
              "--span": cell.span,
              backgroundImage: `url("${cell.tile.src}")`,
              backgroundPosition: `${cell.posX}% ${cell.posY}%`,
            } as React.CSSProperties
          }
        >
          {/* The wall is a picture; the name is what a screen reader and a
              crawler get, and what surfaces on hover. */}
          <span className="hbw-grid__name">{cell.tile.name}</span>
        </a>
      ))}
    </nav>
  );
}
