import { processCmsRebuild } from "@/sanity/rebuild/process";
import type { RebuildCoalesceState } from "@/sanity/rebuild/authorize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let lastTrigger: RebuildCoalesceState | undefined;

export async function POST(request: Request) {
  const result = await processCmsRebuild(request, { last: lastTrigger });
  lastTrigger = result.last;
  if (typeof result.body === "string") {
    return new Response(result.body || null, {
      status: result.status,
      headers: { "cache-control": "no-store" },
    });
  }
  return Response.json(result.body, {
    status: result.status,
    headers: { "cache-control": "no-store" },
  });
}
