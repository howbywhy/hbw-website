import type { Metadata } from "next";
import { getRecoveredMeta } from "@/lib/recovered";

const meta = getRecoveredMeta("/manifesto");

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
};

export default function ManifestoPage() {
  return null;
}
