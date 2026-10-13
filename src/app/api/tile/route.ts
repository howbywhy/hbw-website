/**
 * The work, served from this origin.
 *
 * The front door draws project stills onto a canvas and then hands that canvas
 * to the Poster as a starting picture. Reading a canvas back requires it to be
 * clean, and an image fetched straight from Sanity taints it: their CDN
 * answers 403 to any request carrying an Origin header, so asking for CORS
 * does not work — it just stops the picture loading. Measured, not assumed.
 *
 * Proxying through here makes the bytes same-origin, so the canvas stays
 * readable. The allowlist is the point: without it this is an open proxy that
 * would fetch anything on the internet on the studio's behalf.
 */
import { CMS_PROJECT_ID } from "@/sanity/cms-fetch";

/** Sanity asset URLs are content-addressed, so a hit can be cached forever. */
const FOREVER = "public, max-age=31536000, s-maxage=31536000, immutable";

export async function GET(request: Request) {
  const asked = new URL(request.url).searchParams.get("src");
  if (!asked) return new Response("No src", { status: 400 });

  let target: URL;
  try {
    target = new URL(asked);
  } catch {
    return new Response("Bad src", { status: 400 });
  }

  // Only this studio's own images, over https, and nothing else.
  const mine =
    target.protocol === "https:" &&
    target.hostname === "cdn.sanity.io" &&
    target.pathname.startsWith(`/images/${CMS_PROJECT_ID}/`);
  if (!mine) return new Response("Not allowed", { status: 403 });

  const upstream = await fetch(target, { cache: "force-cache" });
  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream failed", { status: 502 });
  }

  const type = upstream.headers.get("content-type") ?? "";
  // The allowlist already fixes the host; this fixes what it is allowed to be.
  if (!type.startsWith("image/")) return new Response("Not an image", { status: 502 });

  return new Response(upstream.body, {
    headers: { "content-type": type, "cache-control": FOREVER },
  });
}
