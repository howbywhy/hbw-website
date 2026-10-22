/**
 * What a picture looks like, row by row, as sixty-four numbers.
 *
 * The front page uncovers one project's picture with the next on a seam
 * travelling across the plate. An even seam is a straight edge; the seam the
 * studio drew bends — it lingers where the two pictures differ and races
 * across where they agree, so the join hides in what they share.
 *
 * Knowing where two pictures differ means reading both of them, and the
 * browser cannot: cdn.sanity.io answers any request carrying an Origin
 * header with a 403, so a canvas that draws one of these is tainted and
 * getImageData throws. Next's own image route would be same-origin, but
 * images are unoptimized here on purpose — the site builds its own
 * renditions from Sanity's image API.
 *
 * So the reading happens here, at build, where there is no origin to object
 * to and sharp is already installed. Each picture is reduced to the average
 * brightness of each of sixty-four rows. Two of those subtracted from each
 * other is the per-row difference the seam needs, and it is 64 bytes rather
 * than a photograph.
 *
 * Rows and not columns, which is the one thing about this that is not
 * obvious. The seam is a vertical edge travelling horizontally, so what can
 * vary along it is where each ROW turns over. Per-column timing is not
 * available at any price: the mask is one image translated under the
 * picture, every column reads the same pixels at a different moment, and a
 * single translating mask can only ever produce one straight edge. Varying
 * it down the rows is what makes the edge a curve.
 */
import sharp from "sharp";

/** How many rows a picture is reduced to. */
export const ROWS = 64;

/** Wide enough to average out a column of noise, narrow enough to be free. */
const COLS = 8;

/*
 * Read once per picture per build.
 *
 * The same still is the lead frame of a project and the peep at the end of
 * the band before it, so without this the same picture is fetched and
 * decoded several times over a build that is already fetching everything
 * else it needs.
 */
const seen = new Map<string, Promise<number[] | undefined>>();

/**
 * The average brightness of each row of a picture, 0–255, top to bottom.
 *
 * Returns undefined rather than throwing. A missing profile costs the seam
 * its curve and nothing else — the stylesheet falls back to the even
 * gradient, which is what every picture had until now — so a picture that
 * cannot be read must never be a picture that cannot be shown.
 */
export function rowProfile(url: string): Promise<number[] | undefined> {
  if (!/^https?:\/\//.test(url)) return Promise.resolve(undefined);
  const had = seen.get(url);
  if (had) return had;
  const job = read(url);
  seen.set(url, job);
  return job;
}

async function read(url: string): Promise<number[] | undefined> {
  try {
    const answer = await fetch(url, { cache: "force-cache" });
    if (!answer.ok) return undefined;
    const raw = Buffer.from(await answer.arrayBuffer());

    /*
     * Squashed to 8 x 64, ignoring the picture's own shape.
     *
     * fit: "fill" on purpose. The profile is a description of the picture
     * from its top edge to its bottom edge, and the page crops it to the
     * plate later from the shape it already knows. Letting sharp preserve
     * the aspect here would mean two pictures of different shapes produced
     * profiles that are not comparable row for row, which is the one thing
     * this has to be.
     */
    const pixels = await sharp(raw)
      .resize(COLS, ROWS, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer();

    const rows: number[] = [];
    for (let y = 0; y < ROWS; y += 1) {
      let sum = 0;
      for (let x = 0; x < COLS; x += 1) sum += pixels[y * COLS + x];
      rows.push(Math.round(sum / COLS));
    }
    return rows;
  } catch {
    return undefined;
  }
}
