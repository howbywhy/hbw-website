"use client";

/**
 * The way in: a sheet over the site that you wipe off.
 *
 * Artistic meets commercial, literally. The gesture is a wipe — one broad
 * swipe clears a band, the way you'd clear a fogged window — but the edge it
 * leaves is sprayed rather than ruled, so the site arrives through a mark
 * rather than a transition.
 *
 * It is a sheet, not a world. Everything underneath is the real page: real
 * text, real links, real scroll. The curtain only covers it. That is the whole
 * reason this version works where the last did not — the reveal is the door,
 * not the building.
 *
 * Nothing here is load-bearing. The page beneath is complete and readable with
 * the curtain never touched: scripting off, reduced motion, a crawler or a
 * keyboard all get the site directly. Once enough has been cleared it finishes
 * itself and gets out of the way for good.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/** How wide the wipe reaches, in pixels. */
const WIPE = 96;
/** Cleared enough to mean it: the sheet then takes itself away. */
const DONE = 0.46;

export function Curtain({ onOpen }: { onOpen: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const opened = useRef(false);
  const [touched, setTouched] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d");
    if (!g) return;
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
  }, []);

  /** Take the sheet away for good. */
  const open = useCallback(() => {
    if (opened.current) return;
    opened.current = true;
    setLeaving(true);
    onOpen();
  }, [onOpen]);

  /** How much of the sheet is gone, sampled coarsely — this is not a measurement
   *  anyone sees, it only decides when the door counts as open. */
  const cleared = useCallback(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !g) return 0;
    const step = 24;
    let gone = 0;
    let all = 0;
    try {
      const data = g.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          all++;
          if (data[((y * canvas.width + x) << 2) + 3] < 120) gone++;
        }
      }
    } catch {
      return 0;
    }
    return all ? gone / all : 0;
  }, []);

  /** One pass of the cloth. Rubbed out, not cut out. */
  const wipe = useCallback((x: number, y: number) => {
    const g = canvasRef.current?.getContext("2d");
    if (!g) return;
    g.globalCompositeOperation = "destination-out";
    // A solid core so a swipe genuinely clears, and specks around it so the
    // edge is a mark rather than a rule.
    g.globalAlpha = 1;
    g.beginPath();
    g.arc(x, y, WIPE * 0.52, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = WIPE * (0.5 + Math.random() * 0.62);
      g.globalAlpha = 0.35 + Math.random() * 0.5;
      g.beginPath();
      g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 6 + Math.random() * 17, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }, []);

  useEffect(() => {
    paint();
    const again = () => {
      // A resize repaints the sheet, so anything already wiped comes back. It
      // only happens before the door is open; afterwards this is unmounted.
      if (!opened.current) paint();
    };
    window.addEventListener("resize", again);
    return () => window.removeEventListener("resize", again);
  }, [paint]);

  // Reduced motion gets no puzzle: the site is simply there.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) open();
  }, [open]);

  function at(event: React.PointerEvent) {
    const box = hostRef.current!.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function down(event: React.PointerEvent) {
    drawing.current = true;
    setTouched(true);
    const p = at(event);
    last.current = p;
    wipe(p.x, p.y);
    hostRef.current?.setPointerCapture(event.pointerId);
  }

  function move(event: React.PointerEvent) {
    if (!drawing.current) return;
    const p = at(event);
    const from = last.current ?? p;
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    const span = Math.hypot(dx, dy);
    // Wipe along the whole travel, or a fast swipe leaves gaps in the band.
    const steps = Math.max(1, Math.ceil(span / (WIPE * 0.3)));
    for (let i = 1; i <= steps; i++) wipe(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    last.current = p;
  }

  function up() {
    drawing.current = false;
    last.current = null;
    if (cleared() > DONE) open();
  }

  return (
    <div
      ref={hostRef}
      className={`hbw-curtain${leaving ? " is-leaving" : ""}${touched ? " is-touched" : ""}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      // The sheet is decoration over a complete page. A screen reader should
      // read the site, not the game, and the button below is the way past it.
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
      <div className="hbw-curtain__says">
        <p className="hbw-curtain__mark">How by Why</p>
        <p className="hbw-curtain__line">
          Clarity for brands at a turning point.
          <span className="hbw-curtain__grey"> Wipe to open.</span>
        </p>
      </div>
    </div>
  );
}
