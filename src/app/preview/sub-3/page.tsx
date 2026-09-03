import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPreviewBridge } from "@/components/home/CmsPreviewContext";
import { isCmsPreviewAllowed } from "@/sanity/preview/allowed";
import { loadSub3Preview } from "@/sanity/preview/load-sub3";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SUB:3 CMS preview — HBW",
  robots: { index: false, follow: false },
};

export default async function PreviewSub3Page() {
  if (!isCmsPreviewAllowed()) notFound();

  try {
    const { experience, record } = await loadSub3Preview();
    return <CmsPreviewBridge experience={experience} record={record} />;
  } catch {
    return (
      <p className="hbw-miss" role="status">
        CMS preview unavailable. The public case study at /projects/sub-3 is unaffected.
      </p>
    );
  }
}
