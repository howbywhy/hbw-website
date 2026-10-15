import type { Metadata } from "next";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_E164, CONTACT_WAYS, STUDIO_PLACE } from "@/lib/contact";
import { StructuredData } from "@/components/StructuredData";
import { studioNode } from "@/lib/structured-data";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { PosterLink } from "@/components/site/PosterLink";
import { liveProjects } from "@/components/home/catalog";
import "@/styles/hbw-index.css";

const title = "Contact — How by Why";
const description =
  "Start a conversation with How by Why: email Mark Blackler, or make a poster and send it over.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: { title, description, type: "website", url: "/contact" },
  /*
   * Said here, not left to the root layout.
   *
   * Without its own block a page inherits the layout's twitter card, so this
   * one went out carrying the front page's title over its own picture — the
   * studio's image under the words "Clarity for brands at a turning point".
   */
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Contact is a page now, not a sheet. A sheet cannot be linked to, indexed or
 * sent to anyone, and this is the one address on the site that people need to
 * be able to send to each other.
 */
export default function ContactPage() {
  const projects = liveProjects();
  return (
    <main className="hbw-site">
      {/* The one page whose job is the address, and it was the only one
          publishing nothing a machine could read. */}
      <StructuredData nodes={[studioNode()]} />
      <Bar here="contact" />
      <div className="hbw-wrap">
        <section className="hbw-say">
          <h1>Two ways in.</h1>
          <p>Whichever suits what you have in front of you.</p>
        </section>

        <div className="hbw-band">
          <p className="hbw-chip" style={{ margin: 0 }}>
            {CONTACT_WAYS.write.name}
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            {CONTACT_WAYS.write.note}
          </p>
        </div>
        <div className="hbw-read" style={{ margin: "1rem 0 clamp(36px,8vh,80px)" }}>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            <a href={`tel:${CONTACT_PHONE_E164}`}>{CONTACT_PHONE}</a>
          </p>
          <p className="is-mute">{STUDIO_PLACE}</p>
        </div>

        <div className="hbw-band">
          <p className="hbw-chip" style={{ margin: 0 }}>
            {CONTACT_WAYS.draw.name}
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            {CONTACT_WAYS.draw.note}
          </p>
        </div>
        <div className="hbw-read" style={{ marginTop: "1rem" }}>
          <p className="is-mute">{CONTACT_WAYS.draw.copy}</p>
          <PosterLink />
        </div>

        {/*
          The work, one click away.
          
          Somebody who arrives here from a search for the address could reach
          the studio and the front page but not a single project — the one
          page on the site with no way into the work it exists to talk about.
          Named only: this is a page about getting in touch, and a contact
          sheet of pictures here would be the work arguing with the ask.
        */}
        <div className="hbw-band">
          <p className="hbw-chip" style={{ margin: 0 }}>
            The work
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            {projects.length} projects
          </p>
        </div>
        <ul className="hbw-jobs" style={{ marginBottom: "clamp(36px,8vh,80px)" }}>
          {projects.map((project) => (
            <li key={project.id}>
              <h2>
                <a href={project.href}>{project.name}</a>
              </h2>
              <p className="hbw-m">
                {project.idea} · {project.year}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <Footer />
    </main>
  );
}
