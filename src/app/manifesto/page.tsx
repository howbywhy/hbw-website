import type { Metadata } from "next";
import { RecoveredPage } from "@/components/RecoveredPage";
import { getRecoveredHtml, getRecoveredMeta } from "@/lib/recovered";

const meta = getRecoveredMeta("/manifesto");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function ManifestoPage() {
  return <RecoveredPage html={getRecoveredHtml("/manifesto")} />;
}
