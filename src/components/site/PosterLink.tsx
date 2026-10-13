"use client";

/**
 * The Poster, opened from Contact.
 *
 * It is the one thing here nobody else has, so it stays — but it is a tool
 * someone chooses, not furniture the site wears. It loads only when asked:
 * seventeen hundred lines of editor has no business in the bundle of a page
 * that is mostly an email address.
 */
import dynamic from "next/dynamic";
import { useState } from "react";

const PosterTool = dynamic(
  () => import("@/components/home/PosterTool").then((m) => m.PosterTool),
  { ssr: false }
);

export function PosterLink() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <p>
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>Make a poster</span>
        </button>
      </p>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Poster"
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "#fff" }}
        >
          <button
            type="button"
            className="hbw-m"
            onClick={() => setOpen(false)}
            style={{ position: "absolute", top: 12, right: 14, zIndex: 41, color: "var(--ink)" }}
          >
            Close
          </button>
          <PosterTool />
        </div>
      ) : null}
    </>
  );
}
