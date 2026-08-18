import type { Metadata } from "next";
import { MANIFESTO_COPY } from "@/components/home/studio-copy";

export const metadata: Metadata = {
  title: "Manifesto — HBW",
  description: MANIFESTO_COPY.opening.join(" "),
};

export default function ManifestoPage() {
  return null;
}
