import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPreviewBridge } from "@/components/home/CmsPreviewContext";
import { isCmsPreviewAllowed } from "@/sanity/preview/allowed";
import { loadObrPreview } from "@/sanity/preview/load-obr";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Boy Roy CMS preview — HBW",
  robots: { index: false, follow: false },
};

export default async function PreviewObrPage() {
  if (!isCmsPreviewAllowed()) notFound();

  try {
    const { experience, record } = await loadObrPreview();
    return <CmsPreviewBridge experience={experience} record={record} />;
  } catch {
    return (
      <p className="hbw-miss" role="status">
        CMS preview unavailable. The public case study at /projects/our-boy-roy is unaffected.
      </p>
    );
  }
}
