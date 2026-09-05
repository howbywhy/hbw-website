import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { draftReadClient } from "@/sanity/preview/draft-client";
import { authorizeDraftPreview } from "@/sanity/preview/enable";
import { sanityReadToken } from "@/sanity/preview/token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const configured = Boolean(sanityReadToken());
  const validation = configured
    ? await validatePreviewUrl(draftReadClient(), request.url)
    : { isValid: false };
  const result = authorizeDraftPreview(validation, configured);
  if (!result.ok) {
    return new Response(result.message, {
      status: result.status,
      headers: { "cache-control": "no-store" },
    });
  }
  (await draftMode()).enable();
  redirect(result.location);
}
