/**
 * The work, as blocks.
 *
 * One logotype per project, set in its own field. Logotypes rather than
 * photographs because a wall of six crops competes with itself, while six
 * marks read as a client list — which is what this part of the page is for.
 *
 * The tag is a status, carried per project rather than hardcoded into the
 * markup, so changing one is changing one line. Each block still links to the
 * case study it belongs to: those pages are live and indexed, and a block that
 * went nowhere would break them.
 */
import type { ProjectRecord } from "@/components/home/catalog";

/** What each block says under the mark. Edit here; the markup follows. */
const STATUS: Record<string, string> = {};
const DEFAULT_STATUS = "Coming soon";

export function WorkBlocks({ projects }: { projects: ProjectRecord[] }) {
  return (
    <section className="hbw-blocks" aria-label="Selected work">
      <h2 className="hbw-blocks__title">Selected work</h2>
      <ul className="hbw-blocks__grid">
        {projects.map((project) => (
          <li key={project.id}>
            <a className="hbw-block" href={`/projects/${project.id}`}>
              <span className="hbw-block__art">
                <img
                  src={`/logotypes/${project.id}.svg`}
                  alt={project.name}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="hbw-block__foot">
                <span className="hbw-block__idea">{project.idea}</span>
                <span className="hbw-block__tag">{STATUS[project.id] ?? DEFAULT_STATUS}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
