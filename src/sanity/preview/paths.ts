import { cmsProjectByCmsSlug, cmsProjectByPreviewSlug } from "@/lib/cms-source";

/** CLOSED CMS slug `closed` → `/preview/closed`. Public `/projects/bar-closed` is never a preview path. */
export function previewPathForCmsSlug(slug: string) {
  return cmsProjectByCmsSlug(slug)?.previewPath ?? null;
}

export function previewPathFromRedirect(redirectTo: string | undefined) {
  if (!redirectTo) return null;
  let pathname = redirectTo;
  try {
    if (/^https?:\/\//i.test(redirectTo)) pathname = new URL(redirectTo).pathname;
  } catch {
    return null;
  }
  const [path] = pathname.split("?");
  const match = path?.match(/^\/preview\/([^/]+)$/);
  if (!match) return null;
  return cmsProjectByPreviewSlug(match[1])?.previewPath ?? null;
}

export function safePreviewErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const message = typeof error.message === "string" ? error.message : "";
    if (message && !message.includes("\n") && message.length < 200) {
      return `This draft is incomplete: ${message}`;
    }
  }
  if (error && typeof error === "object" && "kind" in error && "message" in error) {
    const message = typeof error.message === "string" ? error.message : "";
    if (message) return message;
  }
  return "This draft could not be rendered.";
}
