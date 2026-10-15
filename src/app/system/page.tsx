import type { Metadata } from "next";
import { StyleGuide } from "@/components/site/StyleGuide";
import "@/styles/hbw-index.css";

const title = "How by Why — system";
const description =
  "The tokens, specimens and rules this site is built from, read from the live stylesheet.";

/**
 * Not linked, not indexed, not in the sitemap — but fetchable.
 *
 * It exists to be handed to something that is not a person: a model or a
 * tool asked to build something that has to sit alongside this site. So it
 * stays out of search and out of the nav, and it is not disallowed in
 * robots, because a thing given this address has to be able to read it.
 */
export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  alternates: { canonical: "/system" },
};

export default function SystemPage() {
  return (
    <main className="hbw-site">
      <StyleGuide />
    </main>
  );
}
