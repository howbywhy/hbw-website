"use client";

/**
 * The grid is the page: a field of dots, and the field is the navigation.
 *
 * The work line is gone on this way in. Showing the same six projects as a
 * wall of thumbnails and again as a rail of cards is what made the first
 * attempt read as clutter, and on a tall window the two did not fit.
 *
 * Every dot holds a frame and a crop, and at rest shows none of it — it is a
 * mark. Near the pointer the dots grow, square off and open into their own
 * part of the picture, so you only ever see the work you are standing over,
 * and never the same part twice.
 *
 * Drawn on a canvas, not as elements. The first build gave every dot its own
 * anchor with a background image and transitioned transform, opacity and
 * border-radius on each: four hundred and eighty animating boxes cost 47 long
 * tasks and a 437ms frame under throttling. Dropping will-change and the
 * scroll listener changed nothing, which is what said the element count itself
 * was the problem.
 *
 * A canvas holds no links, so the real ones sit under it: one per project,
 * off-screen but reachable. A crawler and a keyboard get a plain list of the
 * work; a pointer gets the field. Clicking routes to the project the nearest
 * dot belongs to, and the viewer opens over the top as it always has.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { GridTile } from "@/sanity/load-grid";

function noise(n: number) {
  let x = (n | 0) || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967296;
}

/** How far the pointer opens the field, in dot widths. */
const REACH = 7;
const GAP = 2;
const INK = "#1d1d1d";

type Dot = {
  tile: GridTile;
  cx: number;
  cy: number;
  px: number;
  py: number;
  /** How readily this one opens. Seeded, so the field has a grain of its own. */
  want: number;
};

export function HomeGrid({ tiles }: { tiles: GridTile[] }) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dots = useRef<Dot[]>([]);
  const cell = useRef(40);
  const images = useRef(new Map<string, HTMLImageElement>());
  const point = useRef({ x: -1, y: -1 });
  const frame = useRef(0);

  /** One link per project, not per dot: the list is for reading, not for show. */
  const projects = useMemo(() => {
    const seen = new Map<string, string>();
    for (const tile of tiles) if (!seen.has(tile.slug)) seen.set(tile.slug, tile.name);
    return [...seen].map(([slug, name]) => ({ slug, name }));
  }, [tiles]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const size = cell.current;
    const reach = size * REACH;
    const { x, y } = point.current;

    // How far each one has opened, then painted smallest first. A window grows
    // past its own cell, so without an order the widest get cut into by
    // whatever happened to be drawn after them. Widest on top reads as depth.
    const open: Array<{ dot: Dot; n: number }> = [];
    for (const dot of dots.current) {
      let n = 0;
      if (x >= 0) {
        const dx = dot.cx - x;
        const dy = dot.cy - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        // Clamped: an appetite above 1 would otherwise send n past 1, and a
        // roundRect with a negative radius throws — which aborts the loop and
        // leaves every dot after it unpainted.
        if (d < reach) n = Math.min(1, ((1 - d / reach) * dot.want) ** 2);
      }
      open.push({ dot, n });
    }
    open.sort((a, b) => a.n - b.n);

    for (const { dot, n } of open) {
      const r = (size / 2) * (0.34 + n * 1.45);
      const img = images.current.get(dot.tile.src);

      if (n > 0.04 && img?.complete && img.naturalWidth) {
        const side = r * 2;
        const src = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - src) * dot.px;
        const sy = (img.naturalHeight - src) * dot.py;
        ctx.save();
        ctx.globalAlpha = Math.min(1, n * 1.4);
        ctx.beginPath();
        // Rounds off as it opens: a dot turning into a window.
        ctx.roundRect(dot.cx - r, dot.cy - r, side, side, r * (1 - n));
        ctx.clip();
        ctx.drawImage(img, sx, sy, src, src, dot.cx - r, dot.cy - r, side, side);
        ctx.restore();
      }

      if (n < 0.96) {
        ctx.beginPath();
        ctx.arc(dot.cx, dot.cy, r, 0, Math.PI * 2);
        ctx.fillStyle = INK;
        ctx.globalAlpha = 0.1 * (1 - n);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  const schedule = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      draw();
    });
  }, [draw]);

  /** Lay the field out for the box it has, and give each dot what it holds. */
  const build = useCallback(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !tiles.length) return;
    const box = host.getBoundingClientRect();
    const w = Math.max(2, Math.round(box.width));
    const h = Math.max(2, Math.round(box.height));
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const size = Math.max(22, Math.min(46, Math.round(w / 46)));
    cell.current = size;
    const step = size + GAP;
    const cols = Math.max(1, Math.floor(w / step));
    const rows = Math.max(1, Math.ceil(h / step));
    const left = (w - (cols * step - GAP)) / 2;

    const out: Dot[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        out.push({
          tile: tiles[i % tiles.length],
          cx: left + c * step + size / 2,
          cy: r * step + size / 2,
          px: noise(i * 40503 + 7),
          py: noise(i * 86969 + 3),
          // Some open readily, some barely at all, so the field does not bloom
          // as one round blob around the pointer: it opens unevenly, the way a
          // crowd turns its head.
          want: 0.45 + noise(i * 2654435761 + 11) * 0.95,
        });
      }
    }
    dots.current = out;
    draw();
  }, [draw, tiles]);

  useEffect(() => {
    // The frames, loaded once and shared by every dot that shows them.
    for (const tile of tiles) {
      if (images.current.has(tile.src)) continue;
      const img = new Image();
      img.decoding = "async";
      // No crossOrigin. Sanity's image CDN answers 403 to any request carrying
      // an Origin header, so asking for CORS does not clean the canvas — it
      // stops the pictures loading at all. The canvas is therefore tainted and
      // cannot be read back, which costs this nothing: it only ever draws.
      img.onload = schedule;
      img.src = tile.src;
      images.current.set(tile.src, img);
    }
  }, [tiles, schedule]);

  useEffect(() => {
    build();
    const host = hostRef.current;
    const ro = host ? new ResizeObserver(build) : null;
    if (host && ro) ro.observe(host);

    const move = (event: PointerEvent) => {
      const box = hostRef.current?.getBoundingClientRect();
      if (!box) return;
      point.current = { x: event.clientX - box.left, y: event.clientY - box.top };
      schedule();
    };
    const leave = () => {
      point.current = { x: -1, y: -1 };
      schedule();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    return () => {
      ro?.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [build, schedule]);

  /** Whichever dot the click landed nearest, within one dot's width. */
  function hit(event: React.MouseEvent<HTMLDivElement>) {
    const box = hostRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    let best: Dot | null = null;
    let bestD = cell.current;
    for (const dot of dots.current) {
      const d = Math.hypot(dot.cx - x, dot.cy - y);
      if (d < bestD) {
        bestD = d;
        best = dot;
      }
    }
    if (best) router.push(`/projects/${best.tile.slug}`);
  }

  if (!tiles.length) return null;

  return (
    <div className="hbw-grid" ref={hostRef} onClick={hit}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <nav className="hbw-grid__links" aria-label="Work">
        <ul>
          {projects.map((project) => (
            <li key={project.slug}>
              <a href={`/projects/${project.slug}`}>{project.name}</a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
