/** Server-only rebuild secrets. Never NEXT_PUBLIC. Never log the values. */

export const SANITY_WEBHOOK_SECRET_ENV = "SANITY_WEBHOOK_SECRET";
export const VERCEL_DEPLOY_HOOK_URL_ENV = "VERCEL_DEPLOY_HOOK_URL";

const PUBLIC_SECRET_PATTERN = /WEBHOOK.*SECRET|DEPLOY_HOOK|VERCEL.*HOOK/i;

export function assertNoPublicRebuildSecrets(env: Record<string, string | undefined> = process.env) {
  const leaked = Object.keys(env).find(
    (key) => key.startsWith("NEXT_PUBLIC_") && PUBLIC_SECRET_PATTERN.test(key)
  );
  if (leaked) {
    throw new Error("CMS rebuild credentials must not use NEXT_PUBLIC_");
  }
}

export function sanityWebhookSecret(env: Record<string, string | undefined> = process.env) {
  assertNoPublicRebuildSecrets(env);
  return env[SANITY_WEBHOOK_SECRET_ENV]?.trim() || undefined;
}

export function vercelDeployHookUrl(env: Record<string, string | undefined> = process.env) {
  assertNoPublicRebuildSecrets(env);
  const url = env[VERCEL_DEPLOY_HOOK_URL_ENV]?.trim();
  if (!url) return undefined;
  if (!isVercelDeployHookUrl(url)) return undefined;
  return url;
}

export function isVercelDeployHookUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "api.vercel.com" &&
      url.pathname.startsWith("/v1/integrations/deploy/")
    );
  } catch {
    return false;
  }
}

export function rebuildConfigured(env: Record<string, string | undefined> = process.env) {
  return Boolean(sanityWebhookSecret(env) && vercelDeployHookUrl(env));
}
