import type { Metadata } from "next";
import { getRecoveredMeta } from "@/lib/recovered";

const meta = getRecoveredMeta("/studio");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function StudioPage() {
  return null;
}
