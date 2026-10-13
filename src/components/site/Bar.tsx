import type { ReactNode } from "react";

/**
 * The bar.
 *
 * Three things, set as plain type: where you can go, the name, and the right
 * slot. On most pages that slot is the positioning; on a project it is that
 * project's own information, which is where a case study's facts belong —
 * in the chrome, always visible, rather than in a panel at the foot of a page
 * nobody scrolls to twice.
 */
export function Bar({
  here,
  says,
}: {
  here?: "work" | "studio" | "contact";
  /** Replaces the positioning on the right. */
  says?: ReactNode;
}) {
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
      <div className="hbw-bar__what">
        {says ?? <p style={{ margin: 0 }}>Clarity for brands at a turning point.</p>}
      </div>
    </header>
  );
}
