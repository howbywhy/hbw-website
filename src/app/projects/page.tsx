import type { Metadata } from "next";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { loadSheets } from "@/sanity/load-gallery";
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
 * The index: every project, named, in one place.
 *
 * The front page is the work itself — a contact sheet per project, scrolled
 * through and opened into — and that is the right way to meet it for someone
 * who has come to look. It is the wrong way to find one project when you
 * already know which one you want, because the only way to know what is
 * there is to scroll all of it.
 *
 * So: a contents page. One module per project on the board, the same board
 * the rest of the site is set on, each one the way into that project. The
 * mark in the bar still goes home to the work; this is the list of it.
 *
 * At /projects, which is where a list of projects belongs and where one
 * already lived before the front page took the job. It redirected to the
 * front page on the grounds that two indexes of the same work compete with
 * each other in search; they still would, so the front page keeps the
 * ranking and this one is the way in for somebody who knows what they are
 * looking for.
 */
export default async function IndexPage() {
  const projects = await loadSheets();
  return (
    <main className="hbw-site">
      <Bar here="index" />
      <div className="hbw-board hbw-board--index">
        <section className="hbw-board__mod hbw-board__mod--wide">
          <h1 className="hbw-board__lead">Index</h1>
          <p>
            Every project, in one place. The front page is the work itself; this
            is the list of it.
          </p>
        </section>

        {projects.map((project) => {
          /* The project's own first frame, because a name on its own is a
             filing cabinet and this is meant to be the work. */
          const first = project.frames[0];
          return (
            <a
              key={project.slug}
              className="hbw-board__mod hbw-board__mod--work"
              href={`/projects/${project.slug}`}
            >
              {first ? (
                <img
                  src={first.src}
                  srcSet={first.srcset}
                  sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw"
                  width={first.width}
                  height={first.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              {/* The name is the link's own text; the rest is what it is. */}
              <h2 className="hbw-board__name">{project.name}</h2>
              <p className="hbw-m">
                {project.year}
                {project.disciplines.length ? ` · ${project.disciplines.join(", ")}` : ""}
              </p>
              <p className="hbw-ink">{project.idea}</p>
            </a>
          );
        })}
      </div>
      <Footer />
    </main>
  );
}
