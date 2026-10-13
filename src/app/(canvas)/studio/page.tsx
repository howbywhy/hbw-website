import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, founderNode, studioNode } from "@/lib/structured-data";
import { STUDIO_COPY } from "@/components/home/studio-copy";
import { CONTACT_EMAIL, STUDIO_PLACE } from "@/lib/contact";
import { CanvasNav } from "@/components/canvas/CanvasNav";
import "@/styles/hbw-canvas.css";

const title = "Studio — HBW";
const description = STUDIO_COPY.opening;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/studio" },
  openGraph: { title, description, type: "website", url: "/studio" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Studio, in the same register as everything else: one column, one type size,
 * no fills. It is the page someone reads rather than plays with, so it has no
 * curtain and no canvas — just the copy the practice already had.
 */
export default function StudioPage() {
  return (
    <main className="hbw-page">
      <StructuredData
        nodes={[
          studioNode(),
          founderNode(),
          breadcrumbNode([
            { name: "HBW", path: "/" },
            { name: "Studio", path: "/studio" },
          ]),
        ]}
      />
      <CanvasNav here="studio" />

      <h1 className="hbw-page__title">Studio</h1>

      <div className="hbw-read">
        {STUDIO_COPY.statement.map((line) => (
          <p key={line} className="hbw-read__lead">
            {line}
          </p>
        ))}
        <p>{STUDIO_COPY.brief}</p>
      </div>

      <section className="hbw-steps" aria-label="How the work goes">
        <h2 className="hbw-steps__title">{STUDIO_COPY.howIntro}</h2>
        <p className="hbw-read__grey hbw-steps__note">{STUDIO_COPY.howTools}</p>
        <ol>
          {STUDIO_COPY.steps.map((step) => (
            <li key={step.id}>
              <span className="hbw-steps__no">{step.id}</span>
              <span className="hbw-steps__name">{step.title}</span>
              <span className="hbw-steps__copy">{step.copy}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="hbw-read hbw-read--end" aria-label="Contact">
        <p>{STUDIO_COPY.philosophy[0]}</p>
        <p className="hbw-read__grey">{STUDIO_COPY.philosophy[1]}</p>
        <p className="hbw-read__meta">
          {STUDIO_COPY.disciplines}
          <span>{STUDIO_PLACE}</span>
        </p>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </section>
    </main>
  );
}
