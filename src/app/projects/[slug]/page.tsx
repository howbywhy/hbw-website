import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { liveProjects, PROJECT_SLUGS, projectDescription } from "@/components/home/catalog";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, projectNode, studioNode } from "@/lib/structured-data";
import { loadExperiences } from "@/sanity/load-experiences";
import { loadSheets } from "@/sanity/load-gallery";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { Work } from "@/components/site/Work";
import { Logotype } from "@/components/site/Logotype";
import { shotsOf } from "@/components/site/shots";
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
 * A project, which is the front page with that project's gallery already open.
 *
 * It is not a second page of the work. The collage that used to live here —
 * the scatter, the grid, the act numbers, the scroll that ran on into the next
 * project — has gone: it showed the same pictures as the gallery, one screen
 * earlier, and opening a project meant leaving the sheet to look at it.
 *
 * The address survives all the same, and it is this file that keeps it worth
 * having: the title, the description and the structured data are the project's
 * own, so a shared link and a crawler both arrive at the project rather than
 * at the top of the site.
 */
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (!PROJECT_SLUGS.includes(slug)) notFound();
  const record = liveProjects().find((project) => project.id === slug);
  if (!record) notFound();

  const experiences = await loadExperiences([slug]);
  const experience = experiences[slug] ?? null;
  const projects = await loadSheets();
  const shots = shotsOf(experience?.movements ?? []);

  return (
    <main className="hbw-site">
      <StructuredData
        nodes={[
          studioNode(),
          projectNode(record),
          breadcrumbNode([
            { name: "How by Why", path: "/" },
            { name: record.name, path: record.href },
          ]),
        ]}
      />
      {/* Not a heading: the gallery's own line is the page's h1, and the same
          words twice is two headings for one page. */}
      <Bar says={<p className="hbw-bar__h1">{record.name} — {record.idea}, {record.year}</p>} />

      <div className="hbw-wrap">
        <Work
          projects={projects}
          marks={Object.fromEntries(
            projects.map((project) => [
              project.slug,
              <Logotype key={project.slug} slug={project.slug} name={project.name} />,
            ])
          )}
          // This project only. The sheet behind it carries the rest, and each
          // of those fetches its own sequence if someone opens it.
          opening={{
            slug,
            // ?f= is read in the browser: this page is prerendered, so the
            // query string does not exist when it is built.
            at: 0,
            name: record.name,
            says: `${record.name} — ${record.idea}, ${record.year}`,
            shots,
            info: infoOf(record, experience),
          }}
        />
      </div>

      <Footer />
    </main>
  );
}
