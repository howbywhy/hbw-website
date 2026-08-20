import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { liveProjects, PROJECT_SLUGS, projectDescription } from "@/components/home/catalog";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const record = liveProjects().find((project) => project.id === slug);
  if (!record) notFound();
  const title = `${record.name} — HBW`;
  const description = projectDescription(record);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: record.href,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (!PROJECT_SLUGS.includes(slug)) notFound();
  return null;
}
