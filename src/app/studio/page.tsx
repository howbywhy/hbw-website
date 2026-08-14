import type { Metadata } from "next";
import { RecoveredPage } from "@/components/RecoveredPage";
import { getRecoveredHtml, getRecoveredMeta } from "@/lib/recovered";

const meta = getRecoveredMeta("/studio");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function StudioPage() {
  return <RecoveredPage html={getRecoveredHtml("/studio")} />;
}
