"use client";

/**
 * The same three words in the same place on every page.
 *
 * Contact is a sheet on the front door and a hash everywhere else, so this
 * takes a handler when one is available and falls back to the address.
 */
export function CanvasNav({
  here,
  onContact,
}: {
  here?: "home" | "work" | "studio";
  onContact?: () => void;
}) {
  return (
    <header className="hbw-top">
      <p className="hbw-top__mark">
        {here === "home" ? "How by Why" : <a href="/">How by Why</a>}
      </p>
      <nav className="hbw-top__nav" aria-label="Site">
        <a href="/work" aria-current={here === "work" ? "page" : undefined}>
          Work
        </a>
        <a href="/studio" aria-current={here === "studio" ? "page" : undefined}>
          Studio
        </a>
        {onContact ? (
          <button type="button" onClick={onContact} aria-haspopup="dialog">
            Contact
          </button>
        ) : (
          <a href="/#contact">Contact</a>
        )}
      </nav>
    </header>
  );
}
