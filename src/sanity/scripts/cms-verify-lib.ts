/**
 * Shared CMS verify helpers.
 * Compare presentation roles, not implementation-specific URL identity.
 */
import { movementPace, movementSpan, type Movement } from "../../components/home/projects/types";

export type VerifyMismatch = { id: string; field: string; expected: unknown; actual: unknown };

export type SanityMovementAssets = {
  still?: { asset?: { originalFilename?: string } };
  poster?: { asset?: { originalFilename?: string } };
  video?: { asset?: { originalFilename?: string } };
  webm?: { asset?: { originalFilename?: string } };
};

export function basename(path: string | undefined) {
  return path?.split("/").pop() ?? "";
}

export function assetName(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const asset = "asset" in value ? (value as { asset?: { originalFilename?: string } }).asset : undefined;
  return asset && "originalFilename" in asset ? (asset.originalFilename ?? "") : "";
}

function mediaIdentity(movement: Movement) {
  return basename(movement.media.type === "video" ? movement.media.mp4 || movement.media.src : movement.media.src);
}

export function compareMovementParity(
  expected: Movement[],
  actual: Movement[],
  raw: SanityMovementAssets[]
): VerifyMismatch[] {
  const mismatches: VerifyMismatch[] = [];
  if (expected.length !== actual.length) {
    mismatches.push({ id: "*", field: "count", expected: expected.length, actual: actual.length });
    return mismatches;
  }
  expected.forEach((left, index) => {
    const right = actual[index];
    const source = raw[index];
    const fields: Array<[string, unknown, unknown]> = [
      ["id", left.id, right.id],
      ["order", index, index],
      ["media.type", left.media.type, right.media.type],
      [
        "media.identity",
        mediaIdentity(left),
        assetName(left.media.type === "video" ? source.video : source.still),
      ],
      ["media.posterIdentity", basename(left.media.poster), left.media.type === "video" ? assetName(source.poster) : ""],
      ["media.webmIdentity", basename(left.media.webm), left.media.webm ? assetName(source.webm) : ""],
      ["media.width", left.media.width, right.media.width],
      ["media.height", left.media.height, right.media.height],
      ["media.fit", left.media.fit, right.media.fit],
      ["media.alt", left.media.alt, right.media.alt],
      ["scale", left.scale, right.scale],
      [
        "pace",
        // CMS explicit pace is production. Local pair-implied tight must not fail that.
        !left.pace && right.pace ? movementPace(right) : movementPace(left),
        movementPace(right),
      ],
      ["relation", left.relation ?? "single", right.relation ?? "single"],
      ["infoHint", left.infoHint, right.infoHint],
      ["kind", left.kind, right.kind],
      ["span.stored", left.span, right.span],
      ["span.resolved", movementSpan(left), movementSpan(right)],
    ];
    for (const [field, exp, act] of fields) {
      if (exp !== act) mismatches.push({ id: left.id, field, expected: exp, actual: act });
    }
    if (!right.media.src.includes("cdn.sanity.io")) {
      mismatches.push({ id: left.id, field: "media.src.host", expected: "cdn.sanity.io", actual: right.media.src });
    }
    if (left.media.webm) {
      if (!right.media.webm?.includes("cdn.sanity.io")) {
        mismatches.push({ id: left.id, field: "media.webm.host", expected: "cdn.sanity.io", actual: right.media.webm });
      }
    } else if (right.media.webm) {
      mismatches.push({ id: left.id, field: "media.webm", expected: undefined, actual: right.media.webm });
    }
  });
  return mismatches;
}

export function previewIdentityDrift(
  catalogSrc: string,
  sanityPreview: unknown
): VerifyMismatch | null {
  const expected = basename(catalogSrc);
  const actual = assetName(sanityPreview);
  if (expected === actual) return null;
  return { id: "record", field: "preview.identity", expected, actual };
}

/** Browse chrome stays in catalog.ts. Sanity preview size/filename may differ. */
export function previewChromeDrift(
  shipped: { src: string; width: number; height: number },
  record: { width: number; height: number },
  sanityPreview: unknown
): VerifyMismatch[] {
  const drift: VerifyMismatch[] = [];
  const identity = previewIdentityDrift(shipped.src, sanityPreview);
  if (identity) drift.push(identity);
  if (shipped.width !== record.width) {
    drift.push({ id: "record", field: "preview.width", expected: shipped.width, actual: record.width });
  }
  if (shipped.height !== record.height) {
    drift.push({ id: "record", field: "preview.height", expected: shipped.height, actual: record.height });
  }
  return drift;
}
