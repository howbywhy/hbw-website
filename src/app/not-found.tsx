import type { Metadata } from "next";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { liveProjects } from "@/components/home/catalog";
import "@/styles/hbw-index.css";

const title = "Not found — HBW";
const description = "That page doesn’t exist.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: true },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * A wrong address, on the site it was a wrong address for.
 *
 * This rendered the old shell — the pre-rebuild nav, its index and its
 * poster tool — so the one page a visitor reaches by mistyping showed them
 * a design that no longer exists, and pulled 1.8MB of superseded media in
 * to do it. It is the same chrome as everywhere else now, and it offers the
 * work rather than an apology.
 */
export default function NotFound() {
  const projects = liveProjects();
  return (
    <main className="hbw-site">
      <Bar />
      <div className="hbw-wrap">
        <section className="hbw-say">
          <h1>That page doesn’t exist.</h1>
          <p>It may have moved, or it may never have been here. The work is below.</p>
        </section>

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
