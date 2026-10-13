/**
 * The same three words in the same place on every page.
 *
 * A server component on purpose: it is three links and a mark, it holds no
 * state, and the front door already carries its own copy because there the
 * chrome has to sit over a canvas.
 */
export function CanvasChrome({ here }: { here?: "work" | "studio" }) {
  return (
    <header className="hbw-canvas__top hbw-canvas__top--page">
      <p className="hbw-canvas__mark">
        <a href="/">How by Why</a>
      </p>
      <nav className="hbw-canvas__nav" aria-label="Site">
        <a href="/work" aria-current={here === "work" ? "page" : undefined}>
          Work
        </a>
        <a href="/studio" aria-current={here === "studio" ? "page" : undefined}>
          Studio
        </a>
        <a href="/#contact">Contact</a>
      </nav>
    </header>
  );
}
