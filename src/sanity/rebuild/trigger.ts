import { vercelDeployHookUrl } from "./secrets";

export type DeployTriggerResult =
  | { ok: true; jobId?: string }
  | { ok: false; status: 502 | 503; reason: "unconfigured" | "trigger-failed" };

export async function triggerProductionRebuild(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<DeployTriggerResult> {
  const hook = vercelDeployHookUrl(env);
  if (!hook) return { ok: false, status: 503, reason: "unconfigured" };
  try {
    const response = await fetchImpl(hook, { method: "POST" });
    if (!response.ok) return { ok: false, status: 502, reason: "trigger-failed" };
    const jobId = await readDeployJobId(response);
    return { ok: true, jobId };
  } catch {
    return { ok: false, status: 502, reason: "trigger-failed" };
  }
}

async function readDeployJobId(response: Response) {
  try {
    const body = (await response.json()) as { job?: { id?: string } };
    return typeof body.job?.id === "string" ? body.job.id : undefined;
  } catch {
    return undefined;
  }
}

export function logRebuildEvent(event: {
  result: "accepted" | "ignored" | "coalesced" | "rejected" | "trigger-failed";
  reason: string;
  documentId?: string;
  jobId?: string;
}) {
  console.info("[hbw-cms-rebuild]", {
    result: event.result,
    reason: event.reason,
    documentId: event.documentId,
    jobId: event.jobId,
    at: new Date().toISOString(),
  });
}
