/** Local development and Vercel preview deployments only. Never production. */
export function isCmsPreviewAllowed() {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.VERCEL_ENV === "preview") return true;
  return process.env.NODE_ENV !== "production";
}
