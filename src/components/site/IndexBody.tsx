"use client";

/**
 * The index: every project, named, in one place.
 *
 * One body, two ways in. It is a page at /projects, so the address exists
 * and a link to it lands somewhere; and it is a sheet the nav opens over
 * whatever you are looking at, which is how About works and so is how this
 * works — you are not taken away from the work to be shown a list of it.
 *
 * Built from the catalogue rather than from the galleries: the record
 * already carries the one frame a card shows, resolved on the server, so a
 * list of six projects does not have to load six case studies to draw six
 * cards.
 */
import { liveProjects } from "@/components/home/catalog";

export function IndexBody({ heading = "p" }: { heading?: "h1" | "p" }) {
  const projects = liveProjects();
  const Lead = heading;
  return (
    <div className="hbw-board hbw-board--index">
      <section className="hbw-board__mod hbw-board__mod--wide">
        <Lead className="hbw-board__lead">Index</Lead>
        <p>
          Every project, in one place. The front page is the work itself; this
          is the list of it.
        </p>
      </section>

      {projects.map((project) => (
        <a key={project.id} className="hbw-board__mod hbw-board__mod--work" href={project.href}>
          {/* The project's own frame, because a list of names is a filing
              cabinet and this is meant to be the work. */}
          <img
            src={project.src}
            srcSet={project.srcSet}
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw"
            width={project.width}
            height={project.height}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <h2 className="hbw-board__name">{project.name}</h2>
          <p className="hbw-m">
            {project.year}
            {project.disciplines?.length ? ` · ${project.disciplines.join(", ")}` : ""}
          </p>
          <p className="hbw-ink">{project.idea}</p>
        </a>
      ))}
    </div>
  );
}
