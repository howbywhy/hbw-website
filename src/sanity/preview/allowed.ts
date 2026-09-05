/** Local development and Vercel preview deployments only. Never production. */
export function isCmsPreviewAllowed(env: Record<string, string | undefined> = process.env) {
  if (env.VERCEL_ENV === "production") return false;
  if (env.VERCEL_ENV === "preview") return true;
  return env.NODE_ENV !== "production";
}

/** Production anonymous stays blocked. A Studio draft-mode session may open /preview. */
export function canAccessCmsPreview(
  draftModeEnabled: boolean,
  env: Record<string, string | undefined> = process.env
) {
  return Boolean(draftModeEnabled) || isCmsPreviewAllowed(env);
}
