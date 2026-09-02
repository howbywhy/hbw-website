import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPreviewBridge } from "@/components/home/CmsPreviewContext";
import { isCmsPreviewAllowed } from "@/sanity/preview/allowed";
import { loadChrisPreview } from "@/sanity/preview/load-chris";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chris Sisarich CMS preview — HBW",
  robots: { index: false, follow: false },
};

export default async function PreviewChrisPage() {
  if (!isCmsPreviewAllowed()) notFound();

  try {
    const { experience, record } = await loadChrisPreview();
    return <CmsPreviewBridge experience={experience} record={record} />;
  } catch {
    return (
      <p className="hbw-miss" role="status">
        CMS preview unavailable. The public case study at /projects/chris-sisarich is unaffected.
      </p>
    );
  }
}
