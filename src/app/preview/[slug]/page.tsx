import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { CmsPreviewBridge } from "@/components/home/CmsPreviewContext";
import { CMS_PREVIEW_SLUGS, cmsProjectByPreviewSlug } from "@/lib/cms-source";
import { canAccessCmsPreview } from "@/sanity/preview/allowed";
import { loadDraftFrontendProject } from "@/sanity/preview/load-draft";
import { safePreviewErrorMessage } from "@/sanity/preview/paths";
import { loadPublishedFrontendProject } from "@/sanity/load-published";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CMS_PREVIEW_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cms = cmsProjectByPreviewSlug(slug);
  return {
    title: `${cms?.label ?? "CMS"} CMS preview — HBW`,
    robots: { index: false, follow: false },
  };
}

export default async function PreviewProjectPage({ params }: Props) {
  const draftEnabled = (await draftMode()).isEnabled;
  if (!canAccessCmsPreview(draftEnabled)) notFound();

  const { slug } = await params;
  const cms = cmsProjectByPreviewSlug(slug);
  if (!cms) notFound();

  try {
    const { experience, record } = draftEnabled
      ? await loadDraftFrontendProject(cms.cmsSlug)
      : await loadPublishedFrontendProject(cms.cmsSlug);
    return <CmsPreviewBridge experience={experience} record={record} />;
  } catch (error) {
    if (draftEnabled) {
      return (
        <p className="hbw-miss" role="alert" data-hbw-preview-error="true">
          Draft preview error. {safePreviewErrorMessage(error)}
        </p>
      );
    }
    return (
      <p className="hbw-miss" role="status">
        CMS preview unavailable. The public case study at {cms.publicPath} is unaffected.
      </p>
    );
  }
}
