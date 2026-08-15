import type { Metadata } from "next";
import { RecoveredPage } from "@/components/RecoveredPage";
import { getRecoveredHtml, getRecoveredMeta, PROJECT_SLUGS } from "@/lib/recovered";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PROJECT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = getRecoveredMeta(`/projects/${slug}`);
  return { title: meta.title, description: meta.description };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (
    slug === "sub-3" ||
    slug === "koja" ||
    slug === "bar-closed" ||
    slug === "our-boy-roy" ||
    slug === "chris-sisarich" ||
    slug === "bistro-nido"
  ) {
    return null;
  }
  return <RecoveredPage html={getRecoveredHtml(`/projects/${slug}`)} />;
}
