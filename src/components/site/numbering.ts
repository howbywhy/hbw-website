/**
 * How the studio numbers its own pictures.
 *
 * Every frame on the site carries the same kind of reference — a short code
 * for the project and its place in that project's sequence, two digits. It is
 * derived, not written down anywhere: a list of codes kept by hand is a list
 * that goes stale the first time a project is renamed.
 *
 *   SCK 04      SUB 11      CLO 02      KOJ 07      CS 03      OBR 05
 *
 * The rule: strip anything that is not a letter or a number, then take the
 * initials of a name with several words, or the first three characters of a
 * name with one. Short enough to sit under a thumbnail, long enough to tell
 * six projects apart.
 */
export function codeOf(name: string): string {
  const words = name.trim().split(/[\s—–-]+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .map((word) => word.replace(/[^A-Za-z0-9]/g, "").charAt(0))
      .join("")
      .toUpperCase();
  }
  return words[0].replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
}

/** A frame's full reference. `at` is zero-based; the reference is not. */
export function refOf(name: string, at: number): string {
  return `${codeOf(name)} ${String(at + 1).padStart(2, "0")}`;
}

/** Where a frame sits in its project, for a counter that shows both. */
export function countOf(at: number, of: number): string {
  return `${String(at + 1).padStart(2, "0")} / ${String(of).padStart(2, "0")}`;
}
