/**
 * The bar.
 *
 * Three things, set as plain type: where you can go, the name, the
 * positioning. No chips — the boxes had come from the old site and they made
 * the nav read as software. Set in the display face, in caps, tracked out, at
 * the same size as the line opposite, so the three sit as one row of writing.
 *
 * Index is gone. The name is the way home, which is what a wordmark is for.
 */
export function Bar({ here }: { here?: "work" | "studio" | "contact" }) {
  return (
    <header className="hbw-bar">
      <nav className="hbw-bar__nav" aria-label="Site">
        <a href="/work" aria-current={here === "work" ? "page" : undefined}>
          Work
        </a>
        <a href="/studio" aria-current={here === "studio" ? "page" : undefined}>
          Studio
        </a>
        <a href="/contact" aria-current={here === "contact" ? "page" : undefined}>
          Contact
        </a>
      </nav>
      <p className="hbw-bar__mark">
        <a href="/">How by Why</a>
      </p>
      <p className="hbw-bar__what">Clarity for brands at a turning point.</p>
    </header>
  );
}
