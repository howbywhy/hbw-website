import type { Metadata } from "next";
import { MANIFESTO_COPY } from "@/components/home/studio-copy";

const title = "Manifesto — HBW";
const description = MANIFESTO_COPY.opening.join(" ");

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/manifesto",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/manifesto",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function ManifestoPage() {
  return null;
}
