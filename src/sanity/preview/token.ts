/** Server-only draft read token. Never NEXT_PUBLIC. Never log the value. */

export const SANITY_API_READ_TOKEN_ENV = "SANITY_API_READ_TOKEN";

export class DraftPreviewError extends Error {
  readonly kind: "missing" | "invalid" | "unavailable" | "unauthorized";

  constructor(kind: DraftPreviewError["kind"], message: string) {
    super(message);
    this.name = "DraftPreviewError";
    this.kind = kind;
  }
}

export function assertNoPublicPreviewSecrets(env: Record<string, string | undefined> = process.env) {
  const leaked = Object.keys(env).find(
    (key) => key.startsWith("NEXT_PUBLIC_") && /SANITY.*TOKEN|PREVIEW.*SECRET/i.test(key)
  );
  if (leaked) {
    throw new DraftPreviewError("unavailable", "Sanity preview credentials must not use NEXT_PUBLIC_");
  }
}

export function sanityReadToken(env: Record<string, string | undefined> = process.env) {
  assertNoPublicPreviewSecrets(env);
  return env[SANITY_API_READ_TOKEN_ENV]?.trim() || undefined;
}

export function requireSanityReadToken(env: Record<string, string | undefined> = process.env) {
  const token = sanityReadToken(env);
  if (!token) {
    throw new DraftPreviewError("unavailable", "Draft preview is not configured.");
  }
  return token;
}
