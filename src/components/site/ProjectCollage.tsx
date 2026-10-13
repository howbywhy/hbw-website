"use client";

/**
 * A case study as a collage.
 *
 * Not a column of pictures and not a grid. Frames sit at different widths and
 * different depths across a twelve-column field, some bleeding off the edge,
 * some pulled up into the one above — so the page is composed rather than
 * stacked, and the project's name sits inside the work instead of on top of
 * a banner above it.
 *
 * The arrangement is a fixed rhythm, not randomness. A random collage has to
 * be regenerated until it looks right and then never looks the same twice;
 * this repeats a seven-step pattern, so it is designed, stable between builds,
 * and the same for everyone.
 *
 * Film costs nothing until a pointer arrives — preload none, the still showing
 * until it runs. The old case studies autoplayed theirs and pulled twenty
 * megabytes a page.
 */
import { useRef } from "react";
import type { Movement } from "@/components/home/projects/types";

/**
 * column start, how many columns wide, and how far it is pulled up.
 * Widths alternate so no two neighbours match; the pulls are what make frames
 * overlap rather than queue.
 */
const RHYTHM = [
  { col: 1, span: 5, pull: 0 },
  { col: 7, span: 6, pull: 90 },
  { col: 4, span: 3, pull: 60 },
  { col: 9, span: 4, pull: 150 },
  { col: 1, span: 6, pull: 70 },
  { col: 8, span: 3, pull: 130 },
  { col: 3, span: 5, pull: 40 },
] as const;

/**
 * Proportions a collage can carry.
 *
 * A sequence holds things that are not photographs — a colour field, a page of
 * type — and some are extremely tall or wide. Left alone, one of them takes a
 * whole screen and the composition is over. Frames are cropped into a range
 * instead; the picture is still the picture, it just cannot run the page.
 */
function usable(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) return 4 / 3;
  return Math.min(1.9, Math.max(0.72, ratio));
}

function Frame({ movement, i, name }: { movement: Movement; i: number; name: string }) {
  const film = useRef<HTMLVideoElement>(null);
  const place = RHYTHM[i % RHYTHM.length];
  const media = movement.media;
  const still = media.type === "video" ? media.poster ?? media.src : media.src;
  const video = media.type === "video" ? media.mp4 ?? media.videoSrc ?? media.src : undefined;
  const ratio = usable(media.width && media.height ? media.width / media.height : 4 / 3);

  return (
    <figure
      className="hbw-col__frame"
      style={{
        gridColumn: `${place.col} / span ${place.span}`,
        marginTop: `-${place.pull}px`,
        // Later frames sit over earlier ones, so a pull reads as depth.
        zIndex: i + 2,
      }}
      onPointerEnter={() => film.current?.play().catch(() => {})}
      onPointerLeave={() => film.current?.pause()}
    >
      <span className="hbw-col__shot" style={{ aspectRatio: String(ratio) }}>
        <img src={still} alt={media.alt ?? ""} loading={i < 2 ? "eager" : "lazy"} decoding="async" />
        {video ? (
          <video ref={film} preload="none" poster={still} muted loop playsInline aria-label={`${name}, film`}>
            {media.webm ? <source src={media.webm} type="video/webm" /> : null}
            <source src={video} type="video/mp4" />
          </video>
        ) : null}
      </span>
      {media.alt ? <figcaption className="hbw-m">{media.alt}</figcaption> : null}
    </figure>
  );
}

export function ProjectCollage({
  movements,
  name,
  idea,
}: {
  movements: Movement[];
  name: string;
  idea: string;
}) {
  return (
    <>
      {/*
        The name is NOT a grid item. It was, with an explicit row, and dense
        auto-placement put a full-height frame in the same row and pushed the
        title under it — the one thing the layout exists to prevent. It sits
        above the grid now and the grid is pulled up over it, so the first
        frames cross the type by construction rather than by luck.
      */}
      <div className="hbw-col__stage">
        {/*
          The title holds while the work moves over it. Sticky rather than
          fixed, so it is the collage that governs how long it stays — it
          arrives with the first frame and leaves with the last, instead of
          sitting under the Information panel at the end of the page.
        */}
        <header className="hbw-col__name">
          <p className="hbw-m hbw-col__idea">{idea}</p>
          <h1>{name}</h1>
        </header>
        <div className="hbw-col">
          {movements.map((movement, i) => (
            <Frame key={movement.id} movement={movement} i={i} name={name} />
          ))}
        </div>
      </div>
    </>
  );
}
