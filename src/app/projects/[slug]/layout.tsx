import { HbwShell } from "@/components/home/HbwShell";
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
  const index = await loadIndex();
  // No `published`: the shell opens this project in the workspace viewer, read
  // from the path, which is the same experience /?work= has always given. The
  // route stays so the canonical URL, its metadata and its structured data do.
  return <HbwShell index={index}>{children}</HbwShell>;
}
