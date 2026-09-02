import { HbwShell } from "@/components/home/HbwShell";
import { resolveProjectExperience } from "@/lib/project-source";

export const dynamic = "force-static";

export default async function ProjectSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const published = slug === "sck" ? await resolveProjectExperience("sck") : null;
  return <HbwShell published={published}>{children}</HbwShell>;
}
