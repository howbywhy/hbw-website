import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, founderNode, studioNode } from "@/lib/structured-data";
import { MANIFESTO_COPY, STUDIO_COPY } from "@/components/home/studio-copy";
import { liveProjects, projectDescription } from "@/components/home/catalog";
import { CONTACT_EMAIL, STUDIO_PLACE } from "@/lib/contact";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import "@/styles/hbw-index.css";

const title = "Studio — How by Why";
const description =
  "How by Why is an independent brand and design practice led by Mark Blackler, working with founders and leadership teams at moments of change.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/studio" },
  openGraph: { title, description, type: "website", url: "/studio" },
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
            { name: "Studio", path: "/studio" },
          ]),
        ]}
      />
      <Bar here="studio" />

      <div className="hbw-wrap hbw-studio-page">
        <section className="hbw-say">
          <h1>{STUDIO_COPY.statement[0]}</h1>
          <p className="is-ink">{STUDIO_COPY.statement[1]}</p>
          <p>{STUDIO_COPY.brief}</p>
        </section>

        {/* The facts, as a list a reader can scan and a crawler can read. */}
        <dl className="hbw-facts">
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
            <dt className="hbw-m">Contact</dt>
            <dd>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </dd>
          </div>
        </dl>

        <div className="hbw-band">
          <p className="hbw-chip" style={{ margin: 0 }}>
            How the work goes
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            Four stages
          </p>
        </div>
        <ol className="hbw-steps">
          {STUDIO_COPY.steps.map((step) => (
            <li key={step.id}>
              <span className="hbw-m">{step.id}</span>
              <span>{step.title}</span>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>

        {/*
          The work, in words.
          
          The front page shows it; this says it — each job named, with what it
          was about, when it was, and what was done. It is the most useful
          thing on the page for someone looking for a practice that has worked
          on something like theirs.
        */}
        <div className="hbw-band" style={{ marginTop: "clamp(40px,9vh,96px)" }}>
          <p className="hbw-chip" style={{ margin: 0 }}>
            Selected work
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            {projects.length} projects
          </p>
        </div>
        <ul className="hbw-jobs">
          {projects.map((project) => (
            <li key={project.id}>
              <h2>
                <a href={project.href}>{project.name}</a>
              </h2>
              <p className="hbw-m">
                {project.idea} · {project.year}
                {project.sectors?.length ? ` · ${project.sectors.join(", ")}` : ""}
              </p>
              <p>{projectDescription(project)}</p>
              {/*
                The written half of the project, which had no way in.

                The name above goes to the gallery — the pictures. The account
                of the work in words lives at its own address and nothing on
                the site pointed at it, so neither a reader nor a crawler
                could reach it. .hbw-read, because that is the class the rule
                that pads a small link out to a 24px target names.
              */}
              <p className="hbw-read" style={{ marginTop: "6px" }}>
                <a href={`${project.href}/story`}>In depth</a>
              </p>
            </li>
          ))}
        </ul>

        {/*
          The manifesto, in full.
          
          The overlay carries the half of it that says what the studio is for;
          the whole thing belongs here, on the page written to be read and to
          be found, rather than nowhere.
        */}
        <div className="hbw-band" style={{ marginTop: "clamp(40px,9vh,96px)" }}>
          <p className="hbw-chip" style={{ margin: 0 }}>
            {STUDIO_COPY.manifestoLabel}
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            {MANIFESTO_COPY.opening.join(" ")}
          </p>
        </div>
        <div className="hbw-read" style={{ marginTop: "1.1rem" }}>
          {MANIFESTO_COPY.reduced.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {MANIFESTO_COPY.body.map((thought) => (
            <p key={thought.join(" ")}>{thought.join(" ")}</p>
          ))}
          <p className="is-ink">{MANIFESTO_COPY.close.join(" ")}</p>
        </div>

        <div className="hbw-band" style={{ marginTop: "clamp(40px,9vh,96px)" }}>
          <p className="hbw-chip" style={{ margin: 0 }}>
            Position
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            {STUDIO_COPY.disciplineList.join(" · ")}
          </p>
        </div>
        <div className="hbw-read" style={{ marginTop: "1.1rem" }}>
          <p>{STUDIO_COPY.philosophy[0]}</p>
          <p className="is-mute">{STUDIO_COPY.philosophy[1]}</p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
