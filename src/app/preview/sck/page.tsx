import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPreviewBridge } from "@/components/home/CmsPreviewContext";
import { isCmsPreviewAllowed } from "@/sanity/preview/allowed";
import { loadSckPreview } from "@/sanity/preview/load-sck";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SCK CMS preview — HBW",
  robots: { index: false, follow: false },
};

export default async function PreviewSckPage() {
  if (!isCmsPreviewAllowed()) notFound();

  try {
    const { experience, record } = await loadSckPreview();
    return <CmsPreviewBridge experience={experience} record={record} />;
  } catch {
    return (
      <p className="hbw-miss" role="status">
        CMS preview unavailable. The public case study at /projects/sck is unaffected.
      </p>
    );
  }
}
