"use client";

/**
 * The work, as a grid.
 *
 * A tile is a picture and a line under it: the name on the left, what the job
 * was on the right, both small and in caps. The caption sits under the frame
 * rather than over it — laid over, it has to fight the picture for contrast
 * and the picture always loses.
 *
 * Everything is in black and white until you touch it. The studio's work is
 * extremely colourful and six colourful tiles side by side shout over each
 * other; grey holds them as one body of work, and colour arrives on the one
 * you are actually looking at. Film wakes on the same gesture, so hovering a
 * tile does one thing: it brings that project to life.
 */
import { useRef } from "react";
import type { Tile as TileData } from "@/sanity/load-gallery";

/**
 * How wide each tile runs, in columns of four.
 *
 * A grid of six identical rectangles is a contact sheet. Letting some run two
 * columns and leaving the gaps where they fall is what makes it modular — the
 * page reads as laid out rather than filled in, and the big tiles say which
 * work is carrying the page.
 */
const SPAN = [2, 1, 1, 1, 2, 1] as const;

function Tile({ tile, i }: { tile: TileData; i: number }) {
  const film = useRef<HTMLVideoElement>(null);
  const span = SPAN[i % SPAN.length];
  const own = tile.width && tile.height ? tile.width / tile.height : 4 / 3;
  // A wide tile holds its width by being landscape. Given a portrait frame it
  // runs two columns wide AND two columns tall, and one job takes the page.
  const ratio = span > 1 ? Math.min(1.9, Math.max(1.15, own)) : Math.min(1.6, Math.max(0.78, own));

  return (
    <a
      className="hbw-tile"
      // The width is a data attribute, not an inline style: inline styles and
      // media queries fight, and at two columns the override was losing.
      data-span={span}
      // ?f= is which frame this tile showed, one-based. The project page
      // opens its gallery there, so clicking a picture continues into that
      // picture rather than dropping you at the top of a case study.
      href={`/projects/${tile.slug}?f=${tile.at + 1}`}
      onPointerEnter={() => film.current?.play().catch(() => {})}
      onPointerLeave={() => film.current?.pause()}
    >
      <span className="hbw-tile__shot" style={{ aspectRatio: String(ratio) }}>
        <img src={tile.src} alt="" loading={i < 4 ? "eager" : "lazy"} decoding="async" />
        {tile.video ? (
          <video ref={film} preload="none" poster={tile.src} muted loop playsInline>
            {tile.webm ? <source src={tile.webm} type="video/webm" /> : null}
            <source src={tile.video} type="video/mp4" />
          </video>
        ) : null}
      </span>
      <span className="hbw-tile__no">{String(tile.at + 1).padStart(2, "0")}</span>
      <span className="hbw-tile__says">
        <span>{tile.name} — {tile.idea}</span>
        <span className="hbw-tile__kind">{tile.kind}</span>
      </span>
    </a>
  );
}

export function WorkGrid({ tiles }: { tiles: TileData[] }) {
  return (
    <section className="hbw-tiles" aria-label="Selected work">
      {tiles.map((tile, i) => (
        <Tile key={tile.slug} tile={tile} i={i} />
      ))}
    </section>
  );
}
