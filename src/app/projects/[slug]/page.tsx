import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { liveProjects, PROJECT_SLUGS, projectDescription } from "@/components/home/catalog";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, projectNode, studioNode } from "@/lib/structured-data";
import { loadExperiences } from "@/sanity/load-experiences";
import { Bar } from "@/components/site/Bar";
import { ProjectRuns } from "@/components/site/ProjectRuns";
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

  // The projects that follow this one, wrapped round so the scroll never runs
  // out of work. Five is plenty: nobody reaches the end of six case studies.
  const line = liveProjects().map((project) => project.id);
  const at = line.indexOf(slug);
  const after = [...line.slice(at + 1), ...line.slice(0, at)].slice(0, 5);

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
        info={{
          label: `${record.name} — ${record.idea}, ${record.year}`,
          body: <ProjectInfo record={record} experience={experience} />,
        }}
      />

      <div className="hbw-wrap">
<ProjectRuns
          slug={slug}
          name={record.name}
          idea={record.idea}
          year={record.year}
          mark={<Logotype slug={slug} name={record.name} />}
          movements={experience?.movements ?? []}
          // Everything after this one, wrapped round, so the scroll never
          // runs out of work.
          after={after}
        />

        <nav className="hbw-foot hbw-m" aria-label="More">
          <a href="/">All work</a>
          <a href="/studio">Studio</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </main>
  );
}
