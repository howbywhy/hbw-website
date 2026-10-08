import { HbwShell } from "@/components/home/HbwShell";
import { loadCatalog } from "@/sanity/load-catalog";
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
  const [index, catalog] = await Promise.all([loadIndex(), loadCatalog()]);
  // No `published`: the shell opens this project in the workspace viewer, read
  // from the path, which is the same experience /?work= has always given. The
  // route stays so the canonical URL, its metadata and its structured data do.
  return (
    <HbwShell index={index} catalog={catalog}>
      {children}
    </HbwShell>
  );
}
