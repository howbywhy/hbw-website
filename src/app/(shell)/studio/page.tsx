import type { Metadata } from "next";
import { STUDIO_COPY } from "@/components/home/studio-copy";

const title = "Studio — HBW";
const description = STUDIO_COPY.opening;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "/studio",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function StudioPage() {
  return null;
}
