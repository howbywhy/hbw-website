import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPreviewBridge } from "@/components/home/CmsPreviewContext";
import { isCmsPreviewAllowed } from "@/sanity/preview/allowed";
import { loadKojaPreview } from "@/sanity/preview/load-koja";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KOJA CMS preview — HBW",
  robots: { index: false, follow: false },
};

export default async function PreviewKojaPage() {
  if (!isCmsPreviewAllowed()) notFound();

  try {
    const { experience, record } = await loadKojaPreview();
    return <CmsPreviewBridge experience={experience} record={record} />;
  } catch {
    return (
      <p className="hbw-miss" role="status">
        CMS preview unavailable. The public case study at /projects/koja is unaffected.
      </p>
    );
  }
}
