/**
 * The bar, worn the way the studio has always worn it.
 *
 * Three chips: where you can go on the left, the name in the middle, the
 * positioning on the right. That arrangement is lifted straight off the live
 * site — it is the one piece of furniture people already recognise as HBW,
 * and the rebuild had replaced it with a row of monospace labels that could
 * have belonged to anyone.
 */
export function Bar({ here }: { here?: "index" | "work" | "studio" | "contact" }) {
  return (
    <header className="hbw-bar">
      <nav className="hbw-bar__nav" aria-label="Site">
        <a href="/" aria-current={here === "index" ? "page" : undefined}>
          Index
        </a>
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
        <span className="hbw-chip">How by Why</span>
      </p>
      <p className="hbw-bar__what">
        <span className="hbw-chip">Clarity for brands at a turning point.</span>
      </p>
    </header>
  );
}
