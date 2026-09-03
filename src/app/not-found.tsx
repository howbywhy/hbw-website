import type { Metadata } from "next";
import { HbwShell } from "@/components/home/HbwShell";

const title = "Not found — HBW";
const description = "That page doesn’t exist. Return to the index.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function NotFound() {
  return (
    <HbwShell>
      <p className="hbw-miss">That page doesn’t exist. Return to the index.</p>
    </HbwShell>
  );
}
