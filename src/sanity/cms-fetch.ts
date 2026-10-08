/**
 * Reading the CMS at build time.
 *
 * Server only. Shared by the index and the catalog so the one subtlety below
 * is stated once rather than copied.
 */
import { get as httpsGet } from "node:https";
import { sanityDataset, sanityProjectId } from "@/sanity/env";

/**
 * The studio's own project and dataset, as sanity.cli.ts already hardcodes
 * them. Neither is a secret: both sit in the public query URL, and the dataset
 * is world-readable.
 *
 * env.ts answers "placeholder" when NEXT_PUBLIC_SANITY_PROJECT_ID is unset,
 * which is right for a fork but wrong here. The production build does not
 * have that variable, so every deploy quietly fell back to the catalog while
 * the CMS held more — a silent, plausible-looking wrong answer, which is the
 * worst kind. Reads use the real dataset whether or not the environment is
 * configured.
 */
export const CMS_PROJECT_ID = sanityProjectId === "placeholder" ? "aagd1kcy" : sanityProjectId;
export const CMS_DATASET = sanityDataset || "production";

/**
 * Fetches over plain node:https rather than fetch().
 *
 * Next patches global fetch and Vercel restores its data cache between builds,
 * so a cached read can answer a build from before the CMS changed — eight new
 * archive entries were published and the next deploy still rendered six.
 * Marking the fetch no-store fixes the staleness but makes every page that
 * renders the shell dynamic, and this site is statically generated.
 *
 * An unpatched request is neither cached nor dynamic: fresh every build,
 * static every page.
 */
export function getText(url: string, timeoutMs = 20000): Promise<string | null> {
  return new Promise((resolve) => {
    const request = httpsGet(url, (response) => {
      const status = response.statusCode ?? 0;
      if (status < 200 || status >= 300) {
        response.resume();
        resolve(null);
        return;
      }
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve(body));
    });
    request.on("error", () => resolve(null));
    request.setTimeout(timeoutMs, () => {
      request.destroy();
      resolve(null);
    });
  });
}

/** Runs a GROQ query and hands back its rows, or null if anything at all went wrong. */
export async function queryRows<T>(query: string, apiVersion: string): Promise<T[] | null> {
  const url =
    `https://${CMS_PROJECT_ID}.api.sanity.io/v${apiVersion}/data/query/` +
    `${CMS_DATASET}?query=${encodeURIComponent(query)}`;
  const body = await getText(url);
  if (!body) return null;
  try {
    const rows = (JSON.parse(body) as { result?: T[] }).result;
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}
