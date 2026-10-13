"use client";

/**
 * A contact sheet per project.
 *
 * Square cells, one hairline apart, as small as still reads. A portfolio that
 * shows nine big pictures per job asks for nine decisions; a sheet asks for
 * one — is this worth opening — which is the only decision this page is for.
 *
 * Film is in the cell but costs nothing until a pointer arrives: preload none,
 * the still showing until it runs. Whole sheets of autoplaying loops are what
 * made the old site pull twenty-six megabytes.
 */
import { useRef } from "react";
import type { ReactNode } from "react";
import type { GalleryProject } from "@/sanity/load-gallery";

function Cell({ project, frame, i }: { project: GalleryProject; frame: GalleryProject["frames"][number]; i: number }) {
  const film = useRef<HTMLVideoElement>(null);
  return (
    <a
      className="hbw-cell"
      // Which frame this is, so the project opens on it rather than at its top.
      href={`/projects/${project.slug}?f=${i + 1}`}
      aria-label={`${project.name} — ${project.idea}`}
      onPointerEnter={() => film.current?.play().catch(() => {})}
      onPointerLeave={() => film.current?.pause()}
    >
      <img src={frame.src} alt={frame.alt ?? ""} loading="lazy" decoding="async" />
      {frame.video ? (
        <video ref={film} preload="none" poster={frame.src} muted loop playsInline>
          {frame.webm ? <source src={frame.webm} type="video/webm" /> : null}
          <source src={frame.video} type="video/mp4" />
        </video>
      ) : null}
    </a>
  );
}

export function Catalogue({
  projects,
  marks,
}: {
  projects: GalleryProject[];
  /** Each project's logotype, rendered on the server. */
  marks: Record<string, ReactNode>;
}) {
  return (
    <>
      {projects.map((project) => (
        <section key={project.slug} aria-labelledby={`p-${project.slug}`}>
          <div className="hbw-band">
            <h2 id={`p-${project.slug}`} className="hbw-chip" style={{ margin: 0 }}>
              <a href={`/projects/${project.slug}`}>{project.name}</a>
            </h2>
            <p className="hbw-m" style={{ margin: 0 }}>
              {project.idea} · {project.year}
            </p>
          </div>
          <div className="hbw-sheet">
            {/*
              The project's mark opens its own sheet, on black. It is also the
              thing that grows into the project page: the browser matches this
              box to the one on the other side by name and carries it across,
              so clicking a project is one continuous move rather than two
              pages.
            */}
            <a
              className="hbw-cell hbw-cell--mark"
              href={`/projects/${project.slug}`}
              aria-label={`${project.name} — ${project.idea}`}
              style={{ viewTransitionName: `p-${project.slug}` }}
            >
              <span className="hbw-cell__mark">{marks[project.slug] ?? project.name}</span>
            </a>
            {project.frames.map((frame, i) => (
              <Cell key={`${project.slug}-${i}`} project={project} frame={frame} i={i} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
