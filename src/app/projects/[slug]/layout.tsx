import { HbwShell } from "@/components/home/HbwShell";
import { loadCatalog } from "@/sanity/load-catalog";
import { loadExperiences } from "@/sanity/load-experiences";
import { loadIndex } from "@/sanity/load-index";

export const dynamic = "force-static";

export default async function ProjectSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Only the project this route is for. Loading the whole line here put every
  // sequence into every page.
  const [index, catalog, experiences] = await Promise.all([
    loadIndex(),
    loadCatalog(),
    loadExperiences([slug]),
  ]);
  // No `published`: the shell opens this project in the workspace viewer, read
  // from the path, which is the same experience /?work= has always given. The
  // route stays so the canonical URL, its metadata and its structured data do.
  return (
    <HbwShell index={index} catalog={catalog} experiences={experiences}>
      {children}
    </HbwShell>
  );
}
