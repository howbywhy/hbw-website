"use client";

/**
 * The work, as a grid you can walk.
 *
 * The front door hides the work under paper, which is a way in and not a way
 * to look at anything. This is the other half: everything laid out, in order,
 * at a size you can read, with the shape of each frame doing the composing.
 *
 * Not a canvas. A gallery has to scroll, be linked to, be read by a crawler
 * and be reachable with a keyboard, and every one of those is free in markup
 * and expensive in a canvas. The canvas earns its place on the front door
 * because the reveal cannot be done any other way; here it would cost a lot
 * and buy nothing.
 *
 * What makes it a composition rather than a contact sheet is span: a wide
 * frame takes two columns, a tall one takes two rows. That comes from the
 * work's own proportions, so each project's grid is shaped by what is in it.
 *
 * Film plays only while a pointer is over it. A page of twenty autoplaying
 * loops is a page that melts a laptop, and a still that starts moving when you
 * look at it is better anyway.
 */
import { useRef } from "react";
import type { GalleryProject } from "@/sanity/load-gallery";

/** How many columns and rows a frame takes, from its own proportions. */
function span(width: number, height: number) {
  const ratio = width / Math.max(1, height);
  if (ratio > 1.7) return "is-wide";
  if (ratio < 0.72) return "is-tall";
  return "";
}

function Frame({ frame, name }: { frame: GalleryProject["frames"][number]; name: string }) {
  const film = useRef<HTMLVideoElement>(null);

  return (
    <div
      className={`hbw-gal__frame ${span(frame.width, frame.height)}`}
      onPointerEnter={() => film.current?.play().catch(() => {})}
      onPointerLeave={() => film.current?.pause()}
    >
      <img src={frame.src} alt={frame.alt ?? ""} loading="lazy" decoding="async" />
      {frame.video ? (
        <video
          ref={film}
          // Nothing is fetched until a pointer asks for it.
          preload="none"
          poster={frame.src}
          muted
          loop
          playsInline
          aria-label={`${name}, film`}
        >
          {frame.webm ? <source src={frame.webm} type="video/webm" /> : null}
          <source src={frame.video} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}

export function Gallery({ projects }: { projects: GalleryProject[] }) {
  return (
    <div className="hbw-gal">
      {projects.map((project) => (
        <section key={project.slug} className="hbw-gal__job" aria-labelledby={`job-${project.slug}`}>
          <header className="hbw-gal__head">
            <h2 id={`job-${project.slug}`}>
              {/*
                The heading is the link. One target per project, where the eye
                already is, rather than a "view project" button underneath.
              */}
              <a href={`/projects/${project.slug}`}>{project.name}</a>
            </h2>
            <p className="hbw-gal__idea">{project.idea}</p>
            <p className="hbw-gal__meta">
              {project.year}
              {project.disciplines.length ? ` · ${project.disciplines.join(", ")}` : ""}
            </p>
          </header>

          <a className="hbw-gal__grid" href={`/projects/${project.slug}`} aria-label={`${project.name} — ${project.idea}`}>
            {project.frames.map((frame, i) => (
              <Frame key={`${project.slug}-${i}`} frame={frame} name={project.name} />
            ))}
          </a>
        </section>
      ))}
    </div>
  );
}
