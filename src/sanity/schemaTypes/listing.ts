/**
 * Two kinds of project document.
 *
 * "featured" is a project on the work line: a full case study, with a
 * proposition, context, the four sections and a movement sequence.
 *
 * "index" is an archive row: name, year, sectors, disciplines, logotype.
 * No page, no case study, nothing else required. New documents start here,
 * because most of what goes in from now on is archive.
 *
 * Every case-study field is hidden AND optional for an index entry. Those
 * two have to agree — a field that is hidden but still required cannot be
 * published, and the editor has no way to see why.
 */

export const LISTING_FEATURED = "featured";
export const LISTING_INDEX = "index";

export type Listing = typeof LISTING_FEATURED | typeof LISTING_INDEX;

export const LISTING_OPTIONS = [
  { title: "Featured — full case study on the work line", value: LISTING_FEATURED },
  { title: "Index — archive row only", value: LISTING_INDEX },
] as const;

/** Loose enough to accept Sanity's own SanityDocument at every call site. */
type MaybeDoc = { [key: string]: unknown } | null | undefined;

/**
 * Documents created before the listing field existed have no value. They are
 * the six on the line, so absence means featured.
 */
export function listingOf(doc: MaybeDoc): Listing {
  return (doc as { listing?: string } | null | undefined)?.listing === LISTING_INDEX
    ? LISTING_INDEX
    : LISTING_FEATURED;
}

export function isFeatured(doc: MaybeDoc) {
  return listingOf(doc) === LISTING_FEATURED;
}

export function isIndexOnly(doc: MaybeDoc) {
  return listingOf(doc) === LISTING_INDEX;
}

/** `hidden` predicate for a field that only applies to a full case study. */
export function featuredOnly({ document }: { document?: MaybeDoc }) {
  return !isFeatured(document);
}

/** Non-empty for a required index column: a string, or a non-empty array. */
function isPresent(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return value != null;
}

/** "Required, but only on a full case study." */
export function requiredWhenFeatured(label: string) {
  return (value: unknown, context: { document?: MaybeDoc }) => {
    if (!isFeatured(context.document)) return true;
    return isPresent(value) || `${label} is required on a featured project`;
  };
}

/** "Required, but only on an archive row." */
export function requiredWhenIndexed(label: string) {
  return (value: unknown, context: { document?: MaybeDoc }) => {
    if (!isIndexOnly(context.document)) return true;
    return isPresent(value) || `${label} is what the index row prints — it cannot be empty`;
  };
}

/** What a Sanity custom validator is allowed to hand back. */
type CheckResult = true | string;

/** Wrap an existing case-study check so it only runs on featured projects. */
export function onlyWhenFeatured<T>(
  check: (value: T, context: { document?: MaybeDoc }) => CheckResult
) {
  return (value: T, context: { document?: MaybeDoc }): CheckResult =>
    isFeatured(context.document) ? check(value, context) : true;
}
