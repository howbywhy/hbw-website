import type { Metadata } from "next";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_E164, STUDIO_PLACE } from "@/lib/contact";
import { Bar } from "@/components/site/Bar";
import { PosterLink } from "@/components/site/PosterLink";
import "@/styles/hbw-index.css";

const title = "Contact — How by Why";
const description =
  "Start a conversation with How by Why: email Mark Blackler, or make a poster and send it over.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: { title, description, type: "website", url: "/contact" },
};

/**
 * Contact is a page now, not a sheet. A sheet cannot be linked to, indexed or
 * sent to anyone, and this is the one address on the site that people need to
 * be able to send to each other.
 */
export default function ContactPage() {
  return (
    <main className="hbw-site">
      <Bar here="contact" />
      <div className="hbw-wrap">
        <section className="hbw-say">
          <h1>Two ways in.</h1>
          <p>Whichever suits what you have in front of you.</p>
        </section>

        <div className="hbw-band">
          <p className="hbw-chip" style={{ margin: 0 }}>
            Write
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            A sentence about what is changing is plenty
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
            Draw
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            Same inbox
          </p>
        </div>
        <div className="hbw-read" style={{ marginTop: "1rem" }}>
          <p className="is-mute">
            Make a poster instead. Spray it, write on it, send it over — it usually says more about
            the problem than a paragraph does.
          </p>
          <PosterLink />
        </div>

        <nav className="hbw-foot hbw-m" aria-label="More">
          <a href="/">Index</a>
          <a href="/work">Work</a>
          <a href="/studio">Studio</a>
        </nav>
      </div>
    </main>
  );
}
