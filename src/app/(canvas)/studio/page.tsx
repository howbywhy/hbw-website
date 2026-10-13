import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, founderNode, studioNode } from "@/lib/structured-data";
import { STUDIO_COPY } from "@/components/home/studio-copy";
import { STUDIO_PLACE } from "@/lib/contact";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import "@/styles/hbw-index.css";

const title = "Studio — How by Why";
const description =
  "How by Why is an independent brand and design practice led by Mark Blackler, working with founders and leadership teams at moments of change.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/studio" },
  openGraph: { title, description, type: "website", url: "/studio" },
};

export default function StudioPage() {
  return (
    <main className="hbw-site">
      <StructuredData
        nodes={[
          studioNode(),
          founderNode(),
          breadcrumbNode([
            { name: "How by Why", path: "/" },
            { name: "Studio", path: "/studio" },
          ]),
        ]}
      />
      <Bar here="studio" />

      <div className="hbw-wrap">
        <section className="hbw-say">
          <h1>{STUDIO_COPY.statement[0]}</h1>
          <p className="is-ink">{STUDIO_COPY.statement[1]}</p>
          <p>{STUDIO_COPY.brief}</p>
        </section>

        <div className="hbw-band">
          <p className="hbw-chip" style={{ margin: 0 }}>
            How the work goes
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            Four stages
          </p>
        </div>
        <ol className="hbw-steps">
          {STUDIO_COPY.steps.map((step) => (
            <li key={step.id}>
              <span className="hbw-m">{step.id}</span>
              <span>{step.title}</span>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>

        <div className="hbw-band" style={{ marginTop: "clamp(40px,9vh,96px)" }}>
          <p className="hbw-chip" style={{ margin: 0 }}>
            Position
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            {STUDIO_COPY.disciplineList.join(" · ")}
          </p>
        </div>
        <div className="hbw-read" style={{ marginTop: "1.1rem" }}>
          <p>{STUDIO_COPY.philosophy[0]}</p>
          <p className="is-mute">{STUDIO_COPY.philosophy[1]}</p>
          <p className="is-mute">{STUDIO_PLACE}</p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
