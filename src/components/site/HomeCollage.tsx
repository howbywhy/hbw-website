"use client";

/**
 * The front page: the work, and one line behind it.
 *
 * What was here was a statement and a list of fourteen rows. It read as a
 * spreadsheet with a headline on top — the one page on the site that showed
 * none of the work it was there to sell.
 *
 * So it is the collage, the same machinery a case study uses, drawing a
 * couple of frames from each project. The positioning holds behind the work
 * and the work moves over it, which is the one gesture this site has. Every
 * frame opens the project it came from.
 */
import { useRef } from "react";
import type { GalleryProject } from "@/sanity/load-gallery";

const RHYTHM = [
  { col: 1, span: 5, pull: 0 },
  { col: 7, span: 6, pull: 90 },
  { col: 4, span: 3, pull: 60 },
  { col: 9, span: 4, pull: 150 },
  { col: 1, span: 6, pull: 70 },
  { col: 8, span: 3, pull: 130 },
  { col: 3, span: 5, pull: 40 },
] as const;

function usable(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) return 4 / 3;
  return Math.min(1.9, Math.max(0.72, ratio));
}

/** Two from each project, interleaved, so no two neighbours are the same job. */
function deal(projects: GalleryProject[]) {
  const out: { project: GalleryProject; frame: GalleryProject["frames"][number] }[] = [];
  for (let round = 0; round < 2; round++) {
    for (const project of projects) {
      // The opener, then something from deeper in, rather than two of the same
      // kind of picture from the top of every sequence.
      const frame = project.frames[round === 0 ? 0 : Math.min(project.frames.length - 1, 3)];
      if (frame) out.push({ project, frame });
    }
  }
  return out;
}

export function HomeCollage({ projects, line }: { projects: GalleryProject[]; line: string }) {
  const dealt = deal(projects);

  return (
    <div className="hbw-col__stage hbw-col__stage--home">
      <header className="hbw-col__name hbw-col__name--home">
        <h1>{line}</h1>
      </header>
      <div className="hbw-col">
        {dealt.map(({ project, frame }, i) => (
          <HomeFrame key={`${project.slug}-${i}`} project={project} frame={frame} i={i} />
        ))}
      </div>
    </div>
  );
}

function HomeFrame({
  project,
  frame,
  i,
}: {
  project: GalleryProject;
  frame: GalleryProject["frames"][number];
  i: number;
}) {
  const film = useRef<HTMLVideoElement>(null);
  const place = RHYTHM[i % RHYTHM.length];
  const ratio = usable(frame.width / Math.max(1, frame.height));

  return (
    <a
      className="hbw-col__frame hbw-col__frame--link"
      href={`/projects/${project.slug}`}
      style={{
        gridColumn: `${place.col} / span ${place.span}`,
        marginTop: `-${place.pull}px`,
        zIndex: i + 2,
      }}
      onPointerEnter={() => film.current?.play().catch(() => {})}
      onPointerLeave={() => film.current?.pause()}
    >
      <span className="hbw-col__shot" style={{ aspectRatio: String(ratio) }}>
        <img src={frame.src} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" />
        {frame.video ? (
          <video ref={film} preload="none" poster={frame.src} muted loop playsInline>
            {frame.webm ? <source src={frame.webm} type="video/webm" /> : null}
            <source src={frame.video} type="video/mp4" />
          </video>
        ) : null}
      </span>
      <span className="hbw-col__says">
        <span className="hbw-col__who">{project.name}</span>
        <span className="hbw-m">{project.idea}</span>
      </span>
    </a>
  );
}
