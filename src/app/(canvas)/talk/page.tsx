import type { Metadata } from "next";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_E164, CONTACT_WAYS, STUDIO_PLACE } from "@/lib/contact";
import { StructuredData } from "@/components/StructuredData";
import { studioNode } from "@/lib/structured-data";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { PosterLink } from "@/components/site/PosterLink";
import { liveProjects } from "@/components/home/catalog";
import { loadArticles } from "@/sanity/load-articles";
import { readDate } from "@/lib/date";
import "@/styles/hbw-index.css";

const title = "Talk — How by Why";
const description =
  "Start a conversation with How by Why: email Mark Blackler, or make a poster and send it over.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/talk" },
  openGraph: { title, description, type: "website", url: "/talk" },
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
export default async function ContactPage() {
  const projects = liveProjects();
  /* Writing is an addition to this page, not a dependency of it: no articles,
     or a CMS that cannot answer, and Talk is the contact page it always was. */
  const articles = await loadArticles();
  return (
    <main className="hbw-site">
      {/* The one page whose job is the address, and it was the only one
          publishing nothing a machine could read. */}
      <StructuredData nodes={[studioNode()]} />
      <Bar here="talk" />
      <div className="hbw-board">
        <section className="hbw-board__mod hbw-board__mod--wide">
          <h1 className="hbw-board__lead">Two ways in.</h1>
          <p>Whichever suits what you have in front of you.</p>
        </section>

        <section className="hbw-board__mod">
          <h2 className="hbw-m">{CONTACT_WAYS.write.name}</h2>
          <p className="hbw-m">{CONTACT_WAYS.write.note}</p>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>
            <a href={`tel:${CONTACT_PHONE_E164}`}>{CONTACT_PHONE}</a>
          </p>
          <p className="is-mute">{STUDIO_PLACE}</p>
        </section>

        <section className="hbw-board__mod">
          <h2 className="hbw-m">{CONTACT_WAYS.draw.name}</h2>
          <p className="hbw-m">{CONTACT_WAYS.draw.note}</p>
          <p className="is-mute">{CONTACT_WAYS.draw.copy}</p>
          <PosterLink />
        </section>

        {/*
          The work, one click away.

          Somebody who arrives here from a search for the address could
          reach the practice and the front page but not a single project —
          the one page on the site with no way into the work it exists to
          talk about. Named only: this is a page about getting in touch, and
          a contact sheet of pictures here would be the work arguing with
          the ask.
        */}
        {/*
          The writing, when there is any.

          Above the work rather than below it: somebody who has come to Talk
          to read something should not have to pass the whole line of
          projects first, and somebody who came for the address has it at the
          top of the page already.
        */}
        {articles.length ? (
          <section className="hbw-board__mod hbw-board__mod--wide hbw-board__mod--read">
            <h2 className="hbw-m">Writing</h2>
            <ul className="hbw-reads">
              {articles.map((article) => (
                <li key={article.slug} className="hbw-reads__one">
                  <a href={`/talk/${article.slug}`}>
                    <span className="hbw-reads__name">{article.title}</span>
                    {article.standfirst ? (
                      <span className="hbw-reads__say">{article.standfirst}</span>
                    ) : null}
                    <time className="hbw-reads__when" dateTime={article.published}>
                      {readDate(article.published)}
                    </time>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {projects.map((project) => (
          <section className="hbw-board__mod" key={project.id}>
            <h2 className="hbw-board__name">
              <a href={project.href}>{project.name}</a>
            </h2>
            <p className="hbw-m">
              {project.idea} · {project.year}
            </p>
          </section>
        ))}
      </div>

      <Footer />
    </main>
  );
}
