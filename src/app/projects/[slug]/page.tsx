import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { liveProjects, PROJECT_SLUGS, projectDescription } from "@/components/home/catalog";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, projectNode, studioNode } from "@/lib/structured-data";
import { loadExperiences } from "@/sanity/load-experiences";
import { Bar } from "@/components/site/Bar";
import { ProjectCollage } from "@/components/site/ProjectCollage";
import { Logotype } from "@/components/site/Logotype";
import { ProjectInfo } from "@/components/site/ProjectInfo";
import "@/styles/hbw-index.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const record = liveProjects().find((project) => project.id === slug);
  if (!record) notFound();
  const title = `${record.name} — How by Why`;
  const description = projectDescription(record);
  return {
    title,
    description,
    alternates: { canonical: record.href },
    openGraph: { title, description, type: "website", url: record.href },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * A case study, in the catalogue's own language: the work as a collage, and
 * everything written about it behind one toggle.
 *
 * This page used to be an empty shell — it returned structured data and let
 * HbwShell paint the project from the path. That shell autoplayed every film
 * in the sequence, which is why a case study weighed twenty megabytes. It is
 * a page of its own now.
 */
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (!PROJECT_SLUGS.includes(slug)) notFound();
  const record = liveProjects().find((project) => project.id === slug);
  if (!record) notFound();

  const experiences = await loadExperiences([slug]);
  const experience = experiences[slug] ?? null;

  const line = liveProjects();
  const at = line.findIndex((project) => project.id === slug);
  const next = line[(at + 1) % line.length];

  return (
    <main className="hbw-site hbw-site--project">
      <StructuredData
        nodes={[
          studioNode(),
          projectNode(record),
          breadcrumbNode([
            { name: "How by Why", path: "/" },
            { name: "Work", path: "/work" },
            { name: record.name, path: record.href },
          ]),
        ]}
      />
      {/*
        The project's facts sit in the bar rather than in a panel at the foot
        of the page: they are what someone wants while they are looking at the
        work, not after they have finished scrolling it.
      */}
      <Bar
        says={
          <h1 className="hbw-bar__h1">
            {record.name} — {record.idea}, {record.year}
          </h1>
        }
      />

      <div className="hbw-wrap">
        <ProjectCollage
          movements={experience?.movements ?? []}
          name={record.name}
          idea={record.idea}
          mark={<Logotype slug={slug} name={record.name} />}
        />

        <ProjectInfo record={record} experience={experience} />

        <nav className="hbw-foot hbw-m" aria-label="More">
          <a href="/work">All work</a>
          <a href="/">Index</a>
          {next && next.id !== slug ? (
            <a href={`/projects/${next.id}`} style={{ marginLeft: "auto" }}>
              Next — {next.name}
            </a>
          ) : null}
        </nav>
      </div>
    </main>
  );
}
