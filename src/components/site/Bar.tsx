/**
 * The frame every page sits in.
 *
 * Three columns of small type and a hairline: who, what, where to. The
 * catalogue states itself in the chrome rather than in a hero, which is what
 * lets every page open straight onto content.
 */
export function Bar({ here }: { here?: "index" | "work" | "studio" | "contact" }) {
  return (
    <header className="hbw-bar">
      <p className="hbw-m" style={{ margin: 0, color: "var(--ink)" }}>
        {here === "index" ? "How by Why" : <a href="/">How by Why</a>}
      </p>
      <p className="hbw-m hbw-bar__what" style={{ margin: 0 }}>
        Brand &amp; design practice — Blue Mountains, AU
      </p>
      <nav className="hbw-m hbw-bar__nav" aria-label="Site">
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
    </header>
  );
}
