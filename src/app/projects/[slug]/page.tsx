import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { liveProjects, PROJECT_SLUGS, projectDescription } from "@/components/home/catalog";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, projectNode, studioNode } from "@/lib/structured-data";
import { loadExperiences } from "@/sanity/load-experiences";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { ProjectRuns } from "@/components/site/ProjectRuns";
import { Logotype } from "@/components/site/Logotype";
import { InfoBody } from "@/components/site/InfoBody";
import { infoOf } from "@/components/site/project-info";
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

  // The one that follows, wrapping round, as a door at the end of this page.
  const line = liveProjects();
  const at = line.findIndex((project) => project.id === slug);
  const following = line[(at + 1) % line.length];

  return (
    <main className="hbw-site hbw-site--project hbw-site--dark">
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
        The bar is given an empty right slot and an empty controls row; the
        runs fill both, because they are the ones that know which project is
        on screen. The page cannot: it holds six of them by the time you are
        a few screens down.
      */}
      <Bar info={{ label: "", body: null }} />

      <div className="hbw-wrap">
<ProjectRuns
          slug={slug}
          name={record.name}
          idea={record.idea}
          year={record.year}
          mark={<Logotype slug={slug} name={record.name} />}
          info={<InfoBody data={infoOf(record, experience)} />}
          movements={experience?.movements ?? []}
          next={
            following && following.id !== slug
              ? {
                  slug: following.id,
                  name: following.name,
                  idea: following.idea,
                  year: following.year,
                  mark: <Logotype slug={following.id} name={following.name} />,
                }
              : null
          }
        />
      </div>

      <Footer />
    </main>
  );
}
