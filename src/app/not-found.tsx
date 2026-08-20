import type { Metadata } from "next";

const title = "Not found — HBW";
const description = "That page doesn't exist. Return to the index.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: {
    title,
    description,
  },
};

export default function NotFound() {
  return <p className="hbw-miss">That page doesn't exist. Return to the index.</p>;
}
