import type { Metadata } from "next";
import { OG_SITE } from "@/lib/site-meta";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, founderNode, studioNode } from "@/lib/structured-data";
import { MANIFESTO_COPY, STUDIO_COPY } from "@/components/home/studio-copy";
import { liveProjects, projectDescription } from "@/components/home/catalog";
import { CONTACT_EMAIL, CONTACT_WAYS, STUDIO_PLACE } from "@/lib/contact";
import { PRACTICE_DESCRIPTION, PRACTICE_TITLE } from "@/lib/site-meta";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import "@/styles/hbw-index.css";

const title = PRACTICE_TITLE;
const description = PRACTICE_DESCRIPTION;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/practice" },
  openGraph: { title, description, type: "website", url: "/practice", ...OG_SITE },
  /*
   * Said here, not left to the root layout.
   *
   * Without its own block a page inherits the layout's twitter card, so this
   * one went out carrying the front page's title over its own picture — the
   * studio's image under the words "Clarity for brands at a turning point".
   */
  twitter: { card: "summary_large_image", title, description },
};

/** Every value of a field across the work, in the order it first appears. */
function across(field: "sectors" | "disciplines") {
  const seen: string[] = [];
  for (const project of liveProjects()) {
    for (const value of project[field] ?? []) if (!seen.includes(value)) seen.push(value);
  }
  return seen;
}

/**
 * The studio, written out.
 *
 * This is the page a search engine reads and a stranger lands on, so it says
 * the things that are true about the practice in words rather than leaving
 * them to be inferred from pictures: what it does, who it does it for, the
 * sectors it has done it in, where it is, and the work itself.
 *
 * The overlay is the other half of the same thing — the short version, for
 * someone already here. Everything on this page is drawn from the work and
 * from copy that was written for it; none of it is filler.
 */
export default function StudioPage() {
  const projects = liveProjects();
  const sectors = across("sectors");
  const disciplines = across("disciplines");

  return (
    <main className="hbw-site">
      <StructuredData
        nodes={[
          studioNode(),
          founderNode(),
          breadcrumbNode([
            { name: "How by Why", path: "/" },
            { name: "Practice", path: "/practice" },
          ]),
        ]}
      />
      <Bar here="practice" />

      {/*
        The board, not a page.

        This was the old page vocabulary — a measure, bands, runs of reading
        — which is the shape the site had before it became objects two
        pixels apart. Every piece of it is a module now, on the same field
        and at the same distance as the studio's blocks and a project's
        information, so the page a stranger lands on is plainly the same
        object as the sheet someone already here opens.

        Nothing is lost in the move: the same words, the same links, the
        same order. It is the ground under them that changed.
      */}
      <div className="hbw-board">
        <section className="hbw-board__mod hbw-board__mod--wide">
          <h1 className="hbw-board__lead">{STUDIO_COPY.statement[0]}</h1>
          <p className="hbw-ink">{STUDIO_COPY.statement[1]}</p>
          <p>{STUDIO_COPY.brief}</p>
        </section>

        {/* The facts, as a list a reader can scan and a crawler can read —
            each one its own bar, as they are everywhere else now. */}
        <dl className="hbw-board__facts hbw-board__mod--wide">
          <div>
            <dt className="hbw-m">Practice</dt>
            <dd>{STUDIO_COPY.line}</dd>
          </div>
          <div>
            <dt className="hbw-m">Led by</dt>
            <dd>Mark Blackler</dd>
          </div>
          <div>
            <dt className="hbw-m">Works with</dt>
            <dd>Founders and leadership teams</dd>
          </div>
          <div>
            <dt className="hbw-m">Based</dt>
            <dd>{STUDIO_PLACE}</dd>
          </div>
          <div>
            <dt className="hbw-m">Disciplines</dt>
            <dd>{disciplines.join(" · ")}</dd>
          </div>
          <div>
            <dt className="hbw-m">Sectors</dt>
            <dd>{sectors.join(" · ")}</dd>
          </div>
          <div>
            <dt className="hbw-m">Talk</dt>
            <dd>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </dd>
          </div>
        </dl>

        {/* How the work goes: one stage to a module, as in the sheet. */}
        {STUDIO_COPY.steps.map((step) => (
          <section className="hbw-board__mod" key={step.id}>
            <h2 className="hbw-m">
              {step.id} {step.title}
            </h2>
            <p>{step.copy}</p>
          </section>
        ))}

        {/*
          The work, in words.

          The front page shows it; this says it — each job named, with what
          it was about, when it was, and what was done. It is the most
          useful thing on the page for someone looking for a practice that
          has worked on something like theirs.
        */}
        {projects.map((project) => (
          <section className="hbw-board__mod" key={project.id}>
            <h2 className="hbw-board__name">
              <a href={project.href}>{project.name}</a>
            </h2>
            <p className="hbw-m">
              {project.idea} · {project.year}
              {project.sectors?.length ? ` · ${project.sectors.join(", ")}` : ""}
            </p>
            <p>{projectDescription(project)}</p>
          </section>
        ))}

        {/*
          The manifesto, in full. The sheet carries the half of it that says
          what the studio is for; the whole thing belongs here, on the page
          written to be read and to be found.
        */}
        <section className="hbw-board__mod hbw-board__mod--all">
          <h2 className="hbw-m">{STUDIO_COPY.manifestoLabel}</h2>
          <p className="hbw-board__lead">{MANIFESTO_COPY.opening.join(" ")}</p>
          <div className="hbw-board__read">
            {MANIFESTO_COPY.reduced.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {MANIFESTO_COPY.body.map((thought) => (
              <p key={thought.join(" ")}>{thought.join(" ")}</p>
            ))}
            <p className="hbw-ink">{MANIFESTO_COPY.close.join(" ")}</p>
          </div>
        </section>

        {/*
          The other way in, offered where people actually land.
          
          This page is what a search result points at, and it offered an email
          address and nothing else — while the poster, which exists precisely
          for the person who would rather not write a paragraph, sat behind a
          button inside a sheet on another page. Same tool, same inbox, now
          reachable from the page that gets the visitors.
        */}
        <section className="hbw-board__mod hbw-board__mod--all">
          <h2 className="hbw-m">{CONTACT_WAYS.draw.name}</h2>
          <p>{CONTACT_WAYS.draw.copy}</p>
          <p>
            <a className="hbw-part__start" href="/#poster">
              Make a poster
            </a>
          </p>
        </section>

        <section className="hbw-board__mod hbw-board__mod--all">
          <h2 className="hbw-m">Position</h2>
          <p className="hbw-m">{STUDIO_COPY.disciplineList.join(" · ")}</p>
          <p>{STUDIO_COPY.philosophy[0]}</p>
          <p className="is-mute">{STUDIO_COPY.philosophy[1]}</p>
        </section>
      </div>

      <Footer />
    </main>
  );
}
