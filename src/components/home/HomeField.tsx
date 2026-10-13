"use client";

/**
 * The ground: HBW, large, and put through the studio's own languages.
 *
 * The Poster left a 577px hole on the home page. Filling it with a picture
 * would have been someone else's answer — this fills it with the name, and
 * then does to it what the work does to other people's names.
 *
 * Every effect is borrowed from a project on this site rather than invented:
 * Spray is the Poster's own tool, Bend is SUB:3 (Bending Time & Space), Dot
 * is CLOSED's halftone, Scatter is the Poster's seeded displacement. So the
 * field is a showreel of what the practice does, performed on its own mark.
 *
 * The letters are drawn once to an offscreen mask and every effect is a way
 * of sampling it, which keeps all four cheap and makes adding a fifth small.
 * Nothing animates on its own: it redraws when the pointer moves and then
 * stops, so an idle tab costs nothing.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export const FIELD_FX = ["spray", "bend", "dot", "scatter"] as const;
export type FieldFx = (typeof FIELD_FX)[number];

export const FX_LABEL: Record<FieldFx, string> = {
  spray: "Spray",
  bend: "Bend",
  dot: "Dot",
  scatter: "Scatter",
};

/** Where each one comes from, for the one-line note under the control. */
export const FX_NOTE: Record<FieldFx, string> = {
  spray: "The Poster’s own can.",
  bend: "SUB:3 — Bending Time & Space.",
  dot: "CLOSED, in halftone.",
  scatter: "Seeded displacement, the way the Poster scatters.",
};

/** xorshift32, the same cheap deterministic noise the Poster scatters with. */
function noise(n: number) {
  let x = (n | 0) || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967296;
}

const INK = "#1d1d1d";

export function HomeField({ fx }: { fx: FieldFx }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<{ data: Uint8ClampedArray; w: number; h: number } | null>(null);
  const pointer = useRef({ x: 0.5, y: 0.5, live: false });
  const frame = useRef(0);

  /** HBW drawn once, as big as the box allows, into an offscreen mask. */
  const buildMask = useCallback((w: number, h: number) => {
    if (w < 2 || h < 2) return;
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const g = off.getContext("2d", { willReadFrequently: true });
    if (!g) return;
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#000";
    g.textBaseline = "middle";
    g.textAlign = "center";
    // Fill the width, then back off so a wide viewport does not clip it.
    let size = Math.min(h * 1.05, w * 0.42);
    g.font = `500 ${size}px Geist, system-ui, sans-serif`;
    const measured = g.measureText("HBW").width;
    if (measured > w * 0.92) {
      size = size * ((w * 0.92) / measured);
      g.font = `500 ${size}px Geist, system-ui, sans-serif`;
    }
    g.fillText("HBW", w / 2, h / 2);
    maskRef.current = { data: g.getImageData(0, 0, w, h).data, w, h };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const mask = maskRef.current;
    if (!canvas || !mask) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h, data } = mask;
    ctx.clearRect(0, 0, w, h);

    const px = pointer.current.x;
    const py = pointer.current.y;
    const on = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return 0;
      return data[(((y | 0) * w + (x | 0)) << 2) + 3];
    };

    if (fx === "bend") {
      // Rows of the mark slide against each other, further the nearer the
      // pointer: the type keeps its shape and loses its timing.
      for (let y = 0; y < h; y += 2) {
        const d = 1 - Math.min(1, Math.abs(y / h - py) * 2.2);
        const shift = Math.sin(y * 0.012 + px * 7) * 90 * d * d;
        for (let x = 0; x < w; x += 2) {
          if (on(x - shift, y) > 40) {
            ctx.fillStyle = INK;
            ctx.globalAlpha = 0.06 + d * 0.11;
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
      ctx.globalAlpha = 1;
      return;
    }

    if (fx === "dot") {
      // A halftone whose dots swell toward the pointer.
      const step = 9;
      for (let y = step / 2; y < h; y += step) {
        for (let x = step / 2; x < w; x += step) {
          if (on(x, y) < 40) continue;
          const dx = x / w - px;
          const dy = y / h - py;
          const near = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2.4);
          const r = (step / 2) * (0.3 + near * 0.72);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = INK;
          ctx.globalAlpha = 0.09 + near * 0.2;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      return;
    }

    if (fx === "scatter") {
      // Cells of the mark pushed off their seat by seeded noise, hardest
      // where the pointer is. Same seed every time, so it is a drawing and
      // not a shimmer.
      const step = 10;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if (on(x + step / 2, y + step / 2) < 40) continue;
          const seed = ((x * 73856093) ^ (y * 19349663)) >>> 0;
          const dx = x / w - px;
          const dy = y / h - py;
          const near = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2.2);
          const push = near * near * 46;
          const ox = (noise(seed) - 0.5) * push;
          const oy = (noise(seed + 1) - 0.5) * push;
          ctx.fillStyle = INK;
          ctx.globalAlpha = 0.08 + near * 0.18;
          ctx.fillRect(x + ox, y + oy, step - 1.5, step - 1.5);
        }
      }
      ctx.globalAlpha = 1;
      return;
    }

    // spray: the Poster's can, biased toward the pointer.
    const step = 7;
    ctx.fillStyle = INK;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (on(x, y) < 40) continue;
        const dx = x / w - px;
        const dy = y / h - py;
        const near = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2.6);
        const n = 1 + Math.round(near * 5);
        const seed = ((x * 374761393) ^ (y * 668265263)) >>> 0;
        for (let i = 0; i < n; i++) {
          const a = noise(seed + i) * Math.PI * 2;
          const rad = Math.pow(noise(seed + i + 97), 0.7) * (3 + near * 13);
          ctx.globalAlpha = 0.06 + near * 0.18;
          ctx.fillRect(x + Math.cos(a) * rad, y + Math.sin(a) * rad, 1.6, 1.6);
        }
      }
    }
    ctx.globalAlpha = 1;
  }, [fx]);

  const schedule = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      draw();
    });
  }, [draw]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const size = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(2, Math.round(r.width));
      const h = Math.max(2, Math.round(r.height));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      buildMask(w, h);
      draw();
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);

    // Web fonts land after first paint and change the letterforms.
    if (document.fonts?.ready) document.fonts.ready.then(size).catch(() => {});

    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.current.x = (e.clientX - r.left) / Math.max(1, r.width);
      pointer.current.y = (e.clientY - r.top) / Math.max(1, r.height);
      pointer.current.live = true;
      schedule();
    };
    window.addEventListener("pointermove", move, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("pointermove", move);
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [buildMask, draw, schedule]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="hbw-field" ref={hostRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

/** The control. Four words and a note, in the site's own register. */
export function HomeFieldPicker({
  fx,
  onPick,
}: {
  fx: FieldFx;
  onPick: (next: FieldFx) => void;
}) {
  return (
    <div className="hbw-field-pick">
      <div className="hbw-field-pick__row" role="group" aria-label="Field">
        {FIELD_FX.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={key === fx}
            onClick={() => onPick(key)}
          >
            {FX_LABEL[key]}
          </button>
        ))}
      </div>
      <p className="hbw-field-pick__note">{FX_NOTE[fx]}</p>
    </div>
  );
}

/** Remembers the last one picked, so the page is not always Spray. */
export function useFieldFx(): [FieldFx, (next: FieldFx) => void] {
  const [fx, setFx] = useState<FieldFx>("spray");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("hbw-field-fx");
      if (saved && (FIELD_FX as readonly string[]).includes(saved)) setFx(saved as FieldFx);
    } catch {
      /* private window, blocked storage: Spray is a fine answer */
    }
  }, []);
  const pick = useCallback((next: FieldFx) => {
    setFx(next);
    try {
      window.localStorage.setItem("hbw-field-fx", next);
    } catch {
      /* nothing to do: the choice just does not outlive the visit */
    }
  }, []);
  return [fx, pick];
}
