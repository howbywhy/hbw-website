export type ShareResult =
  | { kind: "hosted"; url: string }
  | { kind: "local"; note: string };

const LOCAL_NOTE =
  "WhatsApp can carry the decision text. Browsers cannot attach a generated poster file; download the image separately until hosted sharing is configured.";

export async function sharePoster(payload: {
  blob: Blob;
  decision: string;
}): Promise<ShareResult> {
  try {
    const body = new FormData();
    body.append("poster", payload.blob, "hbw-decision.png");
    body.append("decision", payload.decision);
    const res = await fetch("/api/hbw/share", { method: "POST", body });
    if (res.ok) {
      const data = (await res.json()) as { url?: string };
      if (data.url) return { kind: "hosted", url: data.url };
    }
  } catch {
    /* provider absent */
  }
  return { kind: "local", note: LOCAL_NOTE };
}

export function whatsappHref(decision: string, posterUrl?: string) {
  const lines = [
    "Send me the decision you're trying to make.",
    decision.trim() ? `Decision: ${decision.trim()}` : "",
    posterUrl ? posterUrl : "",
  ].filter(Boolean);
  return `https://wa.me/61414833791?text=${encodeURIComponent(lines.join("\n\n"))}`;
}
