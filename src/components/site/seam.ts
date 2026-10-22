/**
 * The seam that hides in what two pictures share.
 *
 * The front page uncovers the next project's picture on an edge travelling
 * across the plate. Evenly, that edge is a straight vertical line — correct,
 * and a ruler. The studio's own transition bends it: the edge lingers where
 * the two pictures differ and races across where they agree, so the join
 * happens where there is least to see.
 *
 * ---- What can and cannot vary ----
 *
 * The wipe is one mask image translated under the picture. Every column of
 * the picture reads the same mask pixels, only at a different moment, so a
 * translating mask cannot give two columns different timings: ask for it and
 * the arithmetic collapses to a single straight edge, which is the even wipe
 * again. Rows are free. Row y reads mask row y and nothing else, so each row
 * can turn over at its own moment, and the edge becomes a curve down the
 * picture rather than a line.
 *
 * So this is a per-row reading, and the edge bends vertically. That is the
 * honest extent of it and the reason the geometry below is one-dimensional.
 *
 * ---- Where the numbers come from ----
 *
 * Each picture arrives already reduced to sixty-four row brightnesses, read
 * at build (see sanity/row-profile, which also says why the browser cannot
 * read these pictures itself). Subtract one profile from the other and that
 * is the difference, row by row.
 *
 * The profiles describe each picture from its own top edge to its own bottom
 * edge. The plate crops them — object-fit: cover, two pictures of different
 * shapes — so each is cropped to its visible band here, against the plate as
 * it actually is on this screen, before they are compared. Comparing them
 * uncropped would be comparing rows a reader cannot see.
 */

/** How the seam behaves. Every number is one of the drawing's. */
export type SeamLook = {
  /** The ramp's width, as a share of the picture's width. */
  soft: number;
  /** How far a row may lag the rest, as a share of the picture's width. */
  linger: number;
  /** Which rows lag: the ones that differ, or the ones that agree. */
  where: "differ" | "agree";
};

/** A picture, as the seam needs to know it. */
export type SeamFrame = {
  rows: number[];
  width: number;
  height: number;
};

export type SeamMask = { map: string; span: string };

/** Wide enough that the ramp is still a gradient once stretched over the plate. */
const MASK_W = 1024;

/*
 * Below this, the two pictures are the same picture as far as a seam is
 * concerned, and the curve would be built out of rounding.
 */
const FLAT = 6 / 255;

/**
 * The band of a picture the plate actually shows, as a fraction of its
 * height, under object-fit: cover.
 *
 * Cover scales until both axes are covered and crops the overflow, centred.
 * A picture wider in proportion than the plate loses nothing vertically; a
 * picture taller in proportion loses the same from the top and the bottom.
 */
function band(frame: SeamFrame, plate: number): [number, number] {
  const shape = frame.width / frame.height;
  if (!(shape > 0) || !(plate > 0)) return [0, 1];
  const seen = Math.min(1, shape / plate);
  return [(1 - seen) / 2, (1 + seen) / 2];
}

/** One profile resampled over its visible band, into `count` rows. */
function crop(frame: SeamFrame, plate: number, count: number): number[] {
  const [top, foot] = band(frame, plate);
  const rows = frame.rows;
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    /* The middle of row i, mapped into the visible band, then into the
       profile — read with a linear blend so a 64-row profile stretched over
       a tall plate is a slope rather than a staircase. */
    const at = (top + ((i + 0.5) / count) * (foot - top)) * (rows.length - 1);
    const low = Math.floor(at);
    const high = Math.min(rows.length - 1, low + 1);
    const mix = at - low;
    out.push(rows[low] * (1 - mix) + rows[high] * mix);
  }
  return out;
}

/** A three-tap blur, run twice: enough to make a curve of a comb. */
function smooth(values: number[]): number[] {
  let out = values;
  for (let pass = 0; pass < 2; pass += 1) {
    const next = out.map((_, i) => {
      const a = out[Math.max(0, i - 1)];
      const b = out[i];
      const c = out[Math.min(out.length - 1, i + 1)];
      return (a + 2 * b + c) / 4;
    });
    out = next;
  }
  return out;
}

/**
 * Build the mask that takes one picture off and puts the other on.
 *
 * Returns null when there is nothing to build with — no profiles, no canvas,
 * or two pictures that do not differ enough to bend an edge. The stylesheet
 * falls back to the even gradient in every one of those cases, so null is a
 * plainer seam and never a missing picture.
 */
export function seamMask(
  from: SeamFrame | null,
  to: SeamFrame | null,
  plate: number,
  look: SeamLook
): SeamMask | null {
  if (!from?.rows?.length || !to?.rows?.length) return null;
  if (typeof document === "undefined") return null;

  const count = Math.min(from.rows.length, to.rows.length);
  const a = crop(from, plate, count);
  const b = crop(to, plate, count);

  const raw = a.map((v, i) => Math.abs(v - b[i]) / 255);
  const soft = smooth(raw);
  const low = Math.min(...soft);
  const high = Math.max(...soft);
  if (high - low < FLAT) return null;

  /*
   * Stretched to fill nought to one.
   *
   * Two frames of the same project differ by a few levels and two frames of
   * different projects by a hundred, and an edge that bends in proportion to
   * that would be straight for half the work on the site. What matters is
   * where these two pictures differ relative to each other, not by how much
   * against some absolute.
   */
  const span = 2 + look.soft + look.linger;
  const lag = soft.map((v) => {
    const share = (v - low) / (high - low);
    return look.linger * (look.where === "differ" ? share : 1 - share);
  });

  const canvas = document.createElement("canvas");
  canvas.width = MASK_W;
  canvas.height = count;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  /* One picture width, in mask pixels. */
  const unit = MASK_W / span;
  for (let y = 0; y < count; y += 1) {
    /*
     * Clear until the ramp, solid after it, and the ramp pushed along by
     * this row's lag.
     *
     * At rest on the near side the window sits over the mask's first
     * picture-width, which is clear in every row; on the far side it sits
     * past the last ramp, which is solid in every row. The lag lives in the
     * headroom between them, which is what the extra `linger` in the span
     * above is for.
     */
    const start = (1 + lag[y]) * unit;
    const end = (1 + look.soft + lag[y]) * unit;
    const ramp = ctx.createLinearGradient(start, 0, end, 0);
    ramp.addColorStop(0, "rgba(0,0,0,0)");
    ramp.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = ramp;
    ctx.fillRect(0, y, MASK_W, 1);
  }

  try {
    return { map: `url("${canvas.toDataURL("image/png")}")`, span: `${span * 100}%` };
  } catch {
    return null;
  }
}
