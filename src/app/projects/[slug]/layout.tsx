import { HbwShell } from "@/components/home/HbwShell";
import { cmsBackedProject, resolveProjectExperience } from "@/lib/project-source";
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
  const published = cmsBackedProject(slug) ? await resolveProjectExperience(slug) : null;
  const index = await loadIndex();
  return (
    <HbwShell published={published} index={index}>
      {children}
    </HbwShell>
  );
}
