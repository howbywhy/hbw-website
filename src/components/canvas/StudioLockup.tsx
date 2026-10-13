/**
 * The lockup: who this is, in five lines and one column.
 *
 * Narrow on purpose. A measure of about forty characters is read in one go;
 * a full-width paragraph is scanned and abandoned. Everything here is the
 * studio's own copy — nothing is written for the layout.
 */
import { STUDIO_COPY } from "@/components/home/studio-copy";
import { STUDIO_PLACE } from "@/lib/contact";
import { SITE_TAGLINE } from "@/lib/site-meta";

export function StudioLockup() {
  return (
    <section className="hbw-lock" aria-label="How by Why">
      {/*
        The positioning is the heading. The wordmark is forty pixels above in
        the nav, and printing it twice read as a mistake rather than a lockup.
      */}
      <h1 className="hbw-lock__mark">{SITE_TAGLINE}</h1>
      <p className="hbw-lock__line">{STUDIO_COPY.line}, led by Mark Blackler.</p>
      <p className="hbw-lock__line hbw-lock__line--grey">{STUDIO_COPY.partners}</p>
      <p className="hbw-lock__line hbw-lock__line--grey">{STUDIO_COPY.glimpse}</p>
      <p className="hbw-lock__line hbw-lock__meta">
        {STUDIO_COPY.disciplines}
        <span className="hbw-lock__place">{STUDIO_PLACE}</span>
      </p>
    </section>
  );
}
