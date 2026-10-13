"use client";

/**
 * A blank page you have to make something of.
 *
 * The site opens as white paper. The work is already there, laid edge to edge
 * underneath, and none of it shows until someone marks the page. Drag and the
 * can sprays; where it sprays, the paper goes and the work comes through.
 *
 * That is the studio's own pitch performed rather than stated. A brand at a
 * turning point arrives at exactly this: a blank page, and the job of finding
 * what is already under it. It also means the one tool nobody else has — the
 * Poster — is no longer a widget bolted to a corner. What a visitor uncovers
 * IS a poster, and it can be carried straight into the Poster and sent.
 *
 * How it draws. Three canvases:
 *   wall    offscreen, the pictures, laid out once per size
 *   mask    offscreen, white where the paper has been taken off
 *   view    on the page: the wall, showing only through the mask
 * Reveal only ever adds, so a stroke never needs the whole page recomposited —
 * each dab repaints its own small box and nothing else. That is three draw
 * calls per dab however many specks are in it.
 *
 * The mask is drawn entirely by us, so it can be read back: that is what makes
 * "has this spot been uncovered" answerable on click. The wall holds proxied
 * images, same-origin by way of /api/tile, so the view can be read back too
 * and handed to the Poster as a picture.
 */
import { useCallback, useEffect, useImperativeHandle, useRef, type RefObject } from "react";
import type { WallTile } from "@/sanity/load-wall";

export type RevealHandle = {
  /** Take all the paper off. */
  revealAll: () => void;
  /** Draw the page's own opening stroke, so a blank page is not a dead one. */
  demo: () => void;
  /** Put it back. */
  clear: () => void;
  /** What is on the page right now, as a picture, or null if nothing is. */
  snapshot: () => string | null;
  hasMarks: () => boolean;
};

type Cell = { tile: WallTile; x: number; y: number; w: number; h: number };

/**
 * Roughly how wide one picture sits on the wall. Big: at half this, an
 * uncovered patch was a patchwork of flat crops rather than photographs, and
 * the cell edges inside one stroke read as rectangles.
 */
const CELL = 440;
/** The can: how wide a single dab reaches. */
const DAB = 54;

export function RevealField({
  tiles,
  handle,
  onTouch,
  onMarks,
  onOpen,
  onOver,
}: {
  tiles: WallTile[];
  handle: RefObject<RevealHandle | null>;
  /** A visitor drew. Only this retires the hint — the page's own stroke does not. */
  onTouch: () => void;
  /** There is now something on the page, however it got there. */
  onMarks: () => void;
  onOpen: (slug: string) => void;
  /** Which project is under the pointer, once it has been uncovered. */
  onOver: (tile: WallTile | null) => void;
}) {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const wall = useRef<HTMLCanvasElement | null>(null);
  const mask = useRef<HTMLCanvasElement | null>(null);
  const patch = useRef<HTMLCanvasElement | null>(null);
  const cells = useRef<Cell[]>([]);
  const images = useRef(new Map<string, HTMLImageElement>());
  const marked = useRef(false);
  const drawing = useRef(false);
  const moved = useRef(0);
  const last = useRef<{ x: number; y: number } | null>(null);
  const size = useRef({ w: 0, h: 0 });

  /** Repaint one box of the view from the wall, through the mask. */
  const compose = useCallback((x: number, y: number, w: number, h: number) => {
    const view = viewRef.current;
    const scratch = patch.current;
    if (!view || !scratch || !wall.current || !mask.current) return;
    const { w: W, h: H } = size.current;
    // Clip the box to the page, or the sampling below reads outside it.
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(W, Math.ceil(x + w));
    const y1 = Math.min(H, Math.ceil(y + h));
    const bw = x1 - x0;
    const bh = y1 - y0;
    if (bw <= 0 || bh <= 0) return;

    if (scratch.width < bw || scratch.height < bh) {
      scratch.width = Math.max(scratch.width, bw);
      scratch.height = Math.max(scratch.height, bh);
    }
    const s = scratch.getContext("2d");
    const v = view.getContext("2d");
    if (!s || !v) return;

    s.globalCompositeOperation = "source-over";
    s.clearRect(0, 0, bw, bh);
    s.drawImage(wall.current, x0, y0, bw, bh, 0, 0, bw, bh);
    // Keep only what the mask has opened up.
    s.globalCompositeOperation = "destination-in";
    s.drawImage(mask.current, x0, y0, bw, bh, 0, 0, bw, bh);
    s.globalCompositeOperation = "source-over";

    v.clearRect(x0, y0, bw, bh);
    v.drawImage(scratch, 0, 0, bw, bh, x0, y0, bw, bh);
  }, []);

  /** One press of the can. */
  const dab = useCallback(
    (x: number, y: number, strength = 1) => {
      const m = mask.current?.getContext("2d");
      if (!m) return;
      const r = DAB * strength;
      m.fillStyle = "#fff";
      // Specks, not a disc: the edge has to break up or it reads as a hole
      // punched by software rather than a mark made by a hand.
      const specks = Math.round(34 * strength);
      for (let i = 0; i < specks; i++) {
        const a = Math.random() * Math.PI * 2;
        // Square-rooted so the specks spread evenly over the area instead of
        // crowding the middle, then biased back in a little.
        const d = Math.pow(Math.random(), 0.62) * r;
        const size = 5 + Math.random() * 13;
        // Floor well off zero: a very faint speck shows the picture at a few
        // percent over white, which read as nothing at all.
        m.globalAlpha = 0.62 + Math.random() * 0.38;
        m.beginPath();
        m.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, size / 2, 0, Math.PI * 2);
        m.fill();
      }
      // A solid core, so a slow hand still clears paper rather than misting it.
      m.globalAlpha = 1;
      m.beginPath();
      m.arc(x, y, r * 0.4, 0, Math.PI * 2);
      m.fill();

      const pad = r + 14;
      compose(x - pad, y - pad, pad * 2, pad * 2);
    },
    [compose]
  );

  /** Has the paper come off at this spot? */
  const open = useCallback((x: number, y: number) => {
    const m = mask.current?.getContext("2d", { willReadFrequently: true });
    if (!m) return false;
    try {
      return m.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3] > 90;
    } catch {
      return false;
    }
  }, []);

  const cellAt = useCallback((x: number, y: number) => {
    return cells.current.find((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) ?? null;
  }, []);

  /** Lay the wall out for the page it has, and draw whatever has arrived. */
  const build = useCallback(() => {
    const view = viewRef.current;
    if (!view || !tiles.length) return;
    const W = Math.max(2, Math.round(view.clientWidth));
    const H = Math.max(2, Math.round(view.clientHeight));
    size.current = { w: W, h: H };

    for (const ref of [wall, mask]) {
      if (!ref.current) ref.current = document.createElement("canvas");
      ref.current.width = W;
      ref.current.height = H;
    }
    if (!patch.current) patch.current = document.createElement("canvas");
    view.width = W;
    view.height = H;

    const cols = Math.max(2, Math.round(W / CELL));
    const rows = Math.max(2, Math.round(H / CELL));
    const cw = W / cols;
    const ch = H / rows;
    const out: Cell[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push({
          tile: tiles[(r * cols + c) % tiles.length],
          x: c * cw,
          y: r * ch,
          w: cw,
          h: ch,
        });
      }
    }
    cells.current = out;

    const g = wall.current!.getContext("2d");
    if (g) {
      g.clearRect(0, 0, W, H);
      for (const cell of out) paintCell(g, cell);
    }
    // A resize throws the old mask away, so the page starts blank again.
    viewRef.current!.getContext("2d")?.clearRect(0, 0, W, H);
  }, [tiles]);

  /** One picture, cropped to fill its cell. */
  function paintCell(g: CanvasRenderingContext2D, cell: Cell) {
    const img = images.current.get(cell.tile.src);
    if (!img?.complete || !img.naturalWidth) return;
    const scale = Math.max(cell.w / img.naturalWidth, cell.h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    g.save();
    g.beginPath();
    g.rect(cell.x, cell.y, cell.w, cell.h);
    g.clip();
    g.drawImage(img, cell.x + (cell.w - dw) / 2, cell.y + (cell.h - dh) / 2, dw, dh);
    g.restore();
  }

  useImperativeHandle(handle, () => ({
    demo() {
      const { w, h } = size.current;
      if (!w || !h) return;
      marked.current = true;
      onMarks();
      // A single unhurried sweep across the middle, with a wave in it so it
      // reads as an arm rather than a progress bar.
      const from = { x: w * 0.12, y: h * 0.52 };
      const to = { x: w * 0.88, y: h * 0.46 };
      const started = performance.now();
      const run = 1150;
      let at = 0;
      const step = (now: number) => {
        // Eased out: fast away, settling at the end, the way a hand moves.
        const t = Math.min(1, (now - started) / run);
        const eased = 1 - Math.pow(1 - t, 2.4);
        const x = from.x + (to.x - from.x) * eased;
        const y = from.y + (to.y - from.y) * eased + Math.sin(eased * Math.PI * 1.6) * h * 0.07;
        if (at) dab(x, y, 1.15);
        at = 1;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    revealAll() {
      const m = mask.current?.getContext("2d");
      if (!m) return;
      m.globalAlpha = 1;
      m.fillStyle = "#fff";
      m.fillRect(0, 0, size.current.w, size.current.h);
      compose(0, 0, size.current.w, size.current.h);
      marked.current = true;
      onMarks();
    },
    clear() {
      const m = mask.current?.getContext("2d");
      if (!m) return;
      m.clearRect(0, 0, size.current.w, size.current.h);
      viewRef.current?.getContext("2d")?.clearRect(0, 0, size.current.w, size.current.h);
      marked.current = false;
    },
    snapshot() {
      if (!marked.current) return null;
      try {
        // Readable because every picture came through /api/tile, same-origin.
        return viewRef.current?.toDataURL("image/png") ?? null;
      } catch {
        // Something tainted it after all: better no picture than a thrown page.
        return null;
      }
    },
    hasMarks: () => marked.current,
  }));

  // The pictures. Each one paints into the wall as it arrives, and anything
  // already uncovered over that cell is recomposed so it appears there too.
  useEffect(() => {
    for (const tile of tiles) {
      if (images.current.has(tile.src)) continue;
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        const g = wall.current?.getContext("2d");
        if (!g) return;
        for (const cell of cells.current) {
          if (cell.tile.src !== tile.src) continue;
          paintCell(g, cell);
          if (marked.current) compose(cell.x, cell.y, cell.w, cell.h);
        }
      };
      img.src = tile.src;
      images.current.set(tile.src, img);
    }
  }, [tiles, compose]);

  useEffect(() => {
    build();
    const view = viewRef.current;
    if (!view) return;
    const ro = new ResizeObserver(build);
    ro.observe(view);
    return () => ro.disconnect();
  }, [build]);

  function at(event: React.PointerEvent<HTMLCanvasElement>) {
    const box = viewRef.current!.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function down(event: React.PointerEvent<HTMLCanvasElement>) {
    const p = at(event);
    // A tap on work already uncovered opens it. Anywhere else, it sprays.
    if (open(p.x, p.y)) {
      const cell = cellAt(p.x, p.y);
      if (cell) {
        onOpen(cell.tile.slug);
        return;
      }
    }
    viewRef.current?.setPointerCapture(event.pointerId);
    drawing.current = true;
    moved.current = 0;
    last.current = p;
    if (!marked.current) marked.current = true;
    onMarks();
    onTouch();
    dab(p.x, p.y);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    const p = at(event);

    if (!drawing.current) {
      const cell = open(p.x, p.y) ? cellAt(p.x, p.y) : null;
      onOver(cell?.tile ?? null);
      return;
    }

    // Dab along the line travelled rather than only where the pointer landed,
    // or a quick drag leaves a dotted trail instead of a stroke.
    const from = last.current ?? p;
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    const span = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(span / (DAB * 0.34)));
    for (let i = 1; i <= steps; i++) {
      dab(from.x + (dx * i) / steps, from.y + (dy * i) / steps);
    }
    moved.current += span;
    last.current = p;
  }

  function up(event: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    last.current = null;
    viewRef.current?.releasePointerCapture?.(event.pointerId);
  }

  return (
    <canvas
      ref={viewRef}
      className="hbw-reveal"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={() => onOver(null)}
      aria-hidden="true"
    />
  );
}
