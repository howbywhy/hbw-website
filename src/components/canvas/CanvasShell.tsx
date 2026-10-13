"use client";

/**
 * The front door.
 *
 * A complete page — lockup, work, the way to reach the studio — with a sheet
 * over it that you wipe off. The page underneath is real from the first byte:
 * it scrolls, it links, it reads without scripting. The curtain is the door,
 * not the building, which is the difference between this and the version
 * before it.
 *
 * Scrolling is held while the sheet is up, because scrolling a page you cannot
 * see is how you arrive at the bottom of something you never saw the top of.
 */
import { useCallback, useEffect, useState } from "react";
import { PosterTool } from "@/components/home/PosterTool";
import type { ProjectRecord } from "@/components/home/catalog";
import { Curtain } from "@/components/canvas/Curtain";
import { StudioLockup } from "@/components/canvas/StudioLockup";
import { WorkBlocks } from "@/components/canvas/WorkBlocks";
import { ReachSheet } from "@/components/canvas/ReachSheet";
import { CanvasNav } from "@/components/canvas/CanvasNav";

export function CanvasShell({ projects }: { projects: ProjectRecord[] }) {
  const [shut, setShut] = useState(true);
  const [sheet, setSheet] = useState<"reach" | null>(null);
  const [poster, setPoster] = useState(false);

  const open = useCallback(() => setShut(false), []);

  useEffect(() => {
    if (!shut) return;
    const had = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = had;
    };
  }, [shut]);

  /**
   * Contact is a sheet rather than a page, so other pages reach it by hash.
   * Closing puts the address back, or a reload reopens what was just shut.
   */
  useEffect(() => {
    const look = () => {
      if (window.location.hash === "#contact") {
        setShut(false);
        setSheet("reach");
      }
    };
    look();
    window.addEventListener("hashchange", look);
    return () => window.removeEventListener("hashchange", look);
  }, []);

  const close = useCallback(() => {
    setSheet(null);
    if (window.location.hash === "#contact") {
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <>
      <main className="hbw-page hbw-page--home">
        <CanvasNav here="home" onContact={() => setSheet("reach")} />
        <StudioLockup />
        <WorkBlocks projects={projects} />
        <footer className="hbw-foot">
          <a href="/work">All work</a>
          <a href="/studio">Studio</a>
          <button type="button" onClick={() => setSheet("reach")}>
            Contact
          </button>
        </footer>
      </main>

      {shut ? <Curtain onOpen={open} /> : null}

      {sheet === "reach" ? (
        <ReachSheet
          onClose={close}
          onPoster={() => {
            close();
            setPoster(true);
          }}
        />
      ) : null}

      {poster ? (
        <div className="hbw-canvas__poster" role="dialog" aria-modal="true" aria-label="Poster">
          <button type="button" className="hbw-canvas__shut" onClick={() => setPoster(false)}>
            Close
          </button>
          <PosterTool />
        </div>
      ) : null}
    </>
  );
}
