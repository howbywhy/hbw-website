/**
 * A date as the studio writes one: 18 October 2026.
 *
 * Fixed to en-GB and UTC on purpose. Left to the runtime's locale, the same
 * build could print a different date on a different machine, and a page that
 * is prerendered once should not say something else because of where it was
 * built.
 */
export function readDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
