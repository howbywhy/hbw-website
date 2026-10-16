import type { Metadata } from "next";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import "@/styles/hbw-index.css";

const title = "Conversations — How by Why";
const description = "Interviews with Mark Blackler. Nothing published yet.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/conversations" },
  openGraph: { title, description, type: "website", url: "/conversations" },
  twitter: { card: "summary_large_image", title, description },
  /*
   * Kept out of search while it is empty.
   *
   * An address that answers with nothing is worse than one that does not
   * answer at all: it is the kind of page that gets indexed, shown to
   * somebody looking for a conversation, and remembered as a dead end.
   * Take this block out and add the page back to the sitemap on the day
   * there is a first conversation on it.
   */
  robots: { index: false, follow: true },
};

/**
 * Conversations: interviews with Mark Blackler.
 *
 * Built empty on purpose. The address exists, the shape of it exists, and
 * what it will hold is one module per conversation on the board below —
 * so the first one is a matter of adding it rather than of designing a
 * page. There is nothing invented standing in for the interviews in the
 * meantime, because a page that reads as populated when it is not is a
 * lie told in a nice typeface.
 */
export default function ConversationsPage() {
  return (
    <main className="hbw-site">
      <Bar here="conversations" />
      <div className="hbw-board">
        <section className="hbw-board__mod hbw-board__mod--wide">
          <h1 className="hbw-board__lead">Conversations</h1>
          <p>Interviews with Mark Blackler.</p>
        </section>

        <section className="hbw-board__mod">
          <h2 className="hbw-m">Where they will be</h2>
          <p>
            Here. One conversation to a module, on this board, in the order they
            happen.
          </p>
        </section>

        <section className="hbw-board__mod">
          <h2 className="hbw-m">Published so far</h2>
          <p className="hbw-ink">None.</p>
          <p className="is-mute">
            There is nothing here yet. When there is, it will be on this page.
          </p>
        </section>
      </div>
      <Footer />
    </main>
  );
}
