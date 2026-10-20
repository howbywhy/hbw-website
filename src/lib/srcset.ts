/**
 * The same picture at the widths a screen might actually draw it.
 *
 * Its own module so that the catalogue and the looks that feed it can both
 * use it without importing each other. They did, briefly: the catalogue
 * reads the looks to build its records, and each look called this to build
 * a srcset — so the two modules sat in a circle with a function being
 * called while the module that exports it was still being evaluated. The
 * kind of fault that works until the bundler changes its mind about order.
 */
export function srcSetFor(src: string, widths: number[], intrinsic: number) {
  const ext = src.endsWith(".webp") ? "webp" : src.endsWith(".png") ? "png" : "jpg";
  if (ext !== "jpg" && ext !== "webp") return undefined;
  const base = src.replace(/\.(jpg|webp)$/, "");
  return widths.map((w) => `${base}-p-${w}.${ext} ${w}w`).concat(`${src} ${intrinsic}w`).join(", ");
}

/**
 * The same, for a picture the CMS is serving.
 *
 * A still in the repo has its renditions sitting beside it on disk, named
 * by width; a CMS image has none, because the CDN makes them on request. So
 * the widths are asked for rather than looked up, and the intrinsic width
 * caps the list — there is nothing to be gained by asking for a frame
 * larger than the one that was uploaded.
 */
export function cdnSrcSet(url: string, intrinsic: number) {
  const widths = [480, 720, 1080, 1440, 1920].filter((w) => w < intrinsic);
  const join = url.includes("?") ? "&" : "?";
  return widths
    .map((w) => `${url}${join}w=${w}&q=72&auto=format ${w}w`)
    .concat(`${url} ${intrinsic}w`)
    .join(", ");
}
