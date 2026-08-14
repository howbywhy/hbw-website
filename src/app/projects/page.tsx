import type { Metadata } from "next";
import { RecoveredPage } from "@/components/RecoveredPage";
import { getRecoveredHtml, getRecoveredMeta } from "@/lib/recovered";

const meta = getRecoveredMeta("/projects");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function ProjectsPage() {
  return <RecoveredPage html={getRecoveredHtml("/projects")} />;
}
