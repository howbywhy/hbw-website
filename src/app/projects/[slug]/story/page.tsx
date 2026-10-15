import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  liveProjects,
  PROJECT_SLUGS,
  projectDescription,
  type ProjectRecord,
} from "@/components/home/catalog";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, projectNode, studioNode } from "@/lib/structured-data";
import { loadExperiences } from "@/sanity/load-experiences";
import {
  infoSectionHasCopy,
  infoSectionPlainCopy,
  richTextPlainCopy,
  type ProjectExperience,
} from "@/components/home/projects/types";
import { infoOf } from "@/components/site/project-info";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { CaseIndex, type CasePart } from "@/components/site/CaseIndex";
import "@/styles/hbw-index.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECT_SLUGS.map((slug) => ({ slug }));
}

/** Paragraphs out of a block of copy. Blank lines separate them, as they do in the CMS. */
function paragraphs(copy: string | undefined) {
  return (copy ?? "")
    .split(/\n\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** The Context block, whether it is shipped as a string or as rich text. */
function contextCopy(experience: ProjectExperience | null) {
  const context = experience?.context;
  if (!context) return "";
  return typeof context === "string" ? context : richTextPlainCopy(context);
}

/**
 * The three parts, named the way the gallery names them.
 *
 * Nothing is chosen here: every project ships exactly these sections — The
 * idea, The shift, The system — and the index takes its words off the same
 * headings with the article dropped, which is what the gallery's own panel
 * does. A section with no copy is left out rather than printed empty.
 */
function partsOf(experience: ProjectExperience | null) {
  return (experience?.infoSections ?? []).filter(infoSectionHasCopy).map((section) => ({
    id: section.id,
    heading: section.heading,
    name: section.heading.replace(/^The\s+/i, "").replace(/^\w/, (char) => char.toUpperCase()),
    body: paragraphs(infoSectionPlainCopy(section)),
  }));
}

/**
 * The facts, exactly as the gallery's Information panel has them, plus the
 * three it has no room for.
 *
 * The first five come from the same builder the panel uses, so the two cannot
 * drift. Working Context, Collaborators and Featured are the fields a catalog
 * record and a case study already carry and which no page was showing in
 * full — every one of them is a value in the repo, not a line written here.
 */
function factsOf(record: ProjectRecord, experience: ProjectExperience | null) {
  const rows: { label: string; value: ReactNode }[] = infoOf(record, experience).facts.map((fact) => ({
    label: fact.label,
    value: fact.value,
  }));

  const collaborators = (experience?.authorship?.collaborators ?? []).filter((who) => who.name.trim());
  if (collaborators.length) {
    rows.push({
      label: "Collaborators",
      value: (
        <>
          {collaborators.map((who) => (
            <span className="hbw-case__line" key={who.name}>
              {who.url ? (
                <a href={who.url} target="_blank" rel="noopener noreferrer">
                  {who.name}
                </a>
              ) : (
                who.name
              )}
              {` — ${who.contribution}`}
            </span>
          ))}
        </>
      ),
    });
  }

  const working = experience?.authorship?.workingContext?.trim();
  if (working) rows.push({ label: "Working Context", value: working });

  if (record.features?.length) {
    rows.push({
      label: "Featured",
      value: (
        <>
          {record.features.map((feature, i) => (
            <span key={feature.name}>
              {i > 0 ? " · " : null}
              {feature.url ? (
                <a href={feature.url} target="_blank" rel="noopener noreferrer">
                  {feature.name}
                </a>
              ) : (
                feature.name
              )}
            </span>
          ))}
        </>
      ),
    });
  }

  return rows;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const record = liveProjects().find((project) => project.id === slug);
  if (!record) notFound();
  const experiences = await loadExperiences([slug]);
  const opening = paragraphs(contextCopy(experiences[slug] ?? null))[0];
  const title = `${record.name}: ${record.idea} — How by Why`;
  /*
   * Its own sentence, not the gallery's.
   *
   * Two addresses carrying one description is two pages asking to be ranked
   * for the same words. The project's own Context opens this page, so it is
   * what the page is about — and it is copy that already exists rather than a
   * second description written to fill the tag.
   */
  const description = opening ?? projectDescription(record);
  const url = `${record.href}/story`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "article", url },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * A project, in words: the long version of what the gallery's Information
 * panel says in the margin of the pictures.
 *
 * /projects/<slug> is the gallery and keeps that address. This is its own
 * page, nested under it, because the two are halves of one project rather
 * than two projects: the breadcrumb reads Work, then the project, then this,
 * and a reader can get from either to the other.
 *
 * The structure is the studio's, not a copy of it — an index holding the
 * margin while three parts of writing move past, each part's name in a
 * module-wide column and its copy in the column beside. Every word on it is
 * the project's own: the Context, the three sections, and the facts a catalog
 * record and a case study already carry.
 */
export default async function ProjectStoryPage({ params }: Props) {
  const { slug } = await params;
  if (!PROJECT_SLUGS.includes(slug)) notFound();
  const record = liveProjects().find((project) => project.id === slug);
  if (!record) notFound();

  const experiences = await loadExperiences([slug]);
  const experience = experiences[slug] ?? null;

  const opening = paragraphs(contextCopy(experience));
  const parts = partsOf(experience);
  const facts = factsOf(record, experience);
  const index: CasePart[] = parts.map((part) => ({ id: part.id, name: part.name }));

  return (
    <main className="hbw-site">
      <StructuredData
        nodes={[
          studioNode(),
          projectNode(record),
          breadcrumbNode([
            { name: "How by Why", path: "/" },
            { name: record.name, path: record.href },
            { name: "In depth", path: `${record.href}/story` },
          ]),
        ]}
      />
      {/* The bar names where you are without saying the heading twice: the
          page's h1 is the project, so the chrome carries its line. */}
      <Bar
        says={
          <p style={{ margin: 0 }}>
            {record.idea}, {record.year}
          </p>
        }
      />

      <div className="hbw-case-page">
        <div className="hbw-case">
          <header className="hbw-case__mast">
            <h1 className="hbw-case__name">{record.name}</h1>
            <p className="hbw-case__idea">{record.idea}</p>
            {opening.length ? (
              <div className="hbw-case__opening">
                {opening.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}

            {facts.length ? (
              <dl className="hbw-case__facts">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="hbw-m">{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </header>

          <CaseIndex parts={index} work={{ href: record.href, label: "See the work" }} />

          {parts.map((part) => (
            <section key={part.id} className="hbw-case__part" id={part.id} data-case-part={part.id}>
              <h2 className="hbw-m hbw-case__heading">{part.heading}</h2>
              <div className="hbw-case__say">
                {part.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </section>
          ))}

          {/* The end of the reading is the other way round into the work. */}
          <p className="hbw-case__to">
            <a href={record.href}>See the work — {record.name}</a>
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
