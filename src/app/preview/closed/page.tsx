import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPreviewBridge } from "@/components/home/CmsPreviewContext";
import { isCmsPreviewAllowed } from "@/sanity/preview/allowed";
import { loadClosedPreview } from "@/sanity/preview/load-closed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CLOSED CMS preview — HBW",
  robots: { index: false, follow: false },
};

export default async function PreviewClosedPage() {
  if (!isCmsPreviewAllowed()) notFound();

  try {
    const { experience, record } = await loadClosedPreview();
    return <CmsPreviewBridge experience={experience} record={record} />;
  } catch {
    return (
      <p className="hbw-miss" role="status">
        CMS preview unavailable. The public case study at /projects/bar-closed is unaffected.
      </p>
    );
  }
}
