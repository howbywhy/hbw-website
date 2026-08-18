import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRecoveredMeta, PROJECT_SLUGS } from "@/lib/recovered";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!PROJECT_SLUGS.includes(slug)) notFound();
  const meta = getRecoveredMeta(`/projects/${slug}`);
  return { title: meta.title, description: meta.description };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (!PROJECT_SLUGS.includes(slug)) notFound();
  return null;
}
