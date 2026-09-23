import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { liveProjects, PROJECT_SLUGS, projectDescription } from "@/components/home/catalog";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, projectNode, studioNode } from "@/lib/structured-data";

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
  const title = `${record.name} — HBW`;
  const description = projectDescription(record);
  return {
    title,
    description,
    alternates: {
      canonical: record.href,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: record.href,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  if (!PROJECT_SLUGS.includes(slug)) notFound();
  const record = liveProjects().find((project) => project.id === slug);
  if (!record) notFound();
  return (
    <StructuredData
      nodes={[
        studioNode(),
        projectNode(record),
        breadcrumbNode([
          { name: "HBW", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: record.name, path: record.href },
        ]),
      ]}
    />
  );
}
