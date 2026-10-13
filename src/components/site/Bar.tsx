"use client";

/**
 * The bar, and the studio sheet it opens.
 *
 * Three things set as plain type: where you can go, the name, and a right slot
 * that a page can fill with its own heading.
 *
 * Studio is a sheet rather than a page, so the link opens it in place and sets
 * #studio — linkable, and the back button closes it. The href stays /studio so
 * the real page answers without JavaScript and for a crawler.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Sheet } from "@/components/site/Sheet";
import { StudioBody } from "@/components/site/StudioBody";

export function Bar({
  here,
  says,
  info,
}: {
  here?: "work" | "studio" | "contact";
  says?: ReactNode;
  /**
   * A page's own information. The right slot becomes the button that opens
   * it, so it rides in the fixed bar and stays reachable however far down the
   * page you are — a panel at the foot of a long collage is a panel nobody
   * meets twice.
   */
  info?: { label: string; body: ReactNode };
}) {
  const [studio, setStudio] = useState(false);

  useEffect(() => {
    const look = () => setStudio(window.location.hash === "#studio");
    look();
    window.addEventListener("hashchange", look);
    return () => window.removeEventListener("hashchange", look);
  }, []);

  const close = useCallback(() => {
    setStudio(false);
    if (window.location.hash === "#studio") history.back();
  }, []);

  return (
    <>
      <header className="hbw-bar">
        <nav className="hbw-bar__nav" aria-label="Site">
          <a href="/" aria-current={here === "work" ? "page" : undefined}>
            Work
          </a>
          <a
            href="/studio"
            aria-current={here === "studio" ? "page" : undefined}
            onClick={(event) => {
              // A modified click is the visitor asking for the page itself.
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
              event.preventDefault();
              history.pushState(null, "", "#studio");
              setStudio(true);
            }}
          >
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
          {info ? <p style={{ margin: 0 }}>{info.label}</p> : says ?? <p style={{ margin: 0 }}>Clarity for brands at a turning point.</p>}
        </div>
      </header>

      {/* The row the runs fill: Information and the two views. */}
      {info ? <div className="hbw-rail" /> : null}

      {/* The same shell as a project's information: one way of opening, one
          way of closing, one set of behaviours. */}
      {studio ? (
        <Sheet label="Studio" onClose={close}>
          <StudioBody />
        </Sheet>
      ) : null}
    </>
  );
}
