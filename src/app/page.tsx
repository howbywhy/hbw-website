import type { Metadata } from "next";

const title = "HBW — Clarity for brands at a turning point";
const description =
  "HBW is a Sydney brand and design practice working with founders at moments of change. Strategy, identity, and design.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
  },
  twitter: {
    title,
    description,
  },
};

export default function HomePage() {
  return null;
}
