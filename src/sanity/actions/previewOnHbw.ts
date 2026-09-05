import type { SanityClient } from "@sanity/client";
import { createPreviewSecret } from "@sanity/preview-url-secret/create-secret";
import { urlSearchParamPreviewPathname, urlSearchParamPreviewSecret } from "@sanity/preview-url-secret";
import { useClient, useCurrentUser, type DocumentActionComponent } from "sanity";
import { previewPathForCmsSlug } from "../preview/paths";

const PREVIEW_ORIGIN = process.env.SANITY_STUDIO_PREVIEW_ORIGIN?.trim() || "https://www.hbw.works";
const STUDIO_ORIGIN = process.env.SANITY_STUDIO_URL?.trim() || "https://hbw.sanity.studio";

function readSlug(doc: unknown) {
  if (!doc || typeof doc !== "object" || !("slug" in doc)) return "";
  const slug = (doc as { slug?: { current?: string } }).slug;
  return typeof slug?.current === "string" ? slug.current : "";
}

export const previewOnHbwAction: DocumentActionComponent = (props) => {
  const client = useClient({ apiVersion: "2025-02-19" });
  const user = useCurrentUser();
  if (props.type !== "project") return null;
  const slug = readSlug(props.draft) || readSlug(props.published);
  const previewPath = previewPathForCmsSlug(slug);
  return {
    label: "Preview on HBW",
    disabled: !previewPath,
    title: previewPath ? `Open ${previewPath} with the current draft` : "This project is not in the preview registry",
    onHandle: async () => {
      if (!previewPath) {
        props.onComplete();
        return;
      }
      const { secret } = await createPreviewSecret(
        client as unknown as SanityClient,
        "hbw-studio",
        STUDIO_ORIGIN,
        user?.id
      );
      const url = new URL("/api/draft-mode/enable", PREVIEW_ORIGIN);
      url.searchParams.set(urlSearchParamPreviewSecret, secret);
      url.searchParams.set(urlSearchParamPreviewPathname, previewPath);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      props.onComplete();
    },
  };
};
