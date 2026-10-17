import type { Metadata } from "next";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { IndexBody } from "@/components/site/IndexBody";
import "@/styles/hbw-index.css";

const title = "Index — How by Why";
const description = "Every project, in one place.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/projects" },
  openGraph: { title, description, type: "website", url: "/projects" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * The index at its own address.
 *
 * The nav opens the same body as a sheet over whatever you are looking at,
 * the way About does, so nobody is taken off the work to be shown a list of
 * it. This page is what that sheet is a view of: the address a link can
 * point at, and where someone lands who asked for it directly.
 */
export default function IndexPage() {
  return (
    <main className="hbw-site">
      <Bar here="index" />
      <IndexBody heading="h1" />
      <Footer />
    </main>
  );
}
