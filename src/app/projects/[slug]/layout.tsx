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
  await params;
  const [index, catalog, experiences] = await Promise.all([
    loadIndex(),
    loadCatalog(),
    loadExperiences(),
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
