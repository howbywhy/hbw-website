import { NextResponse } from "next/server";

type Body = {
  email?: string;
  name?: string;
  decision?: string;
  poster?: string;
};

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_BYTES = Math.round(2.2 * 1024 * 1024);
const RATE_MAX = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function allowIp(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((at) => now - at < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

function fail(reason: string, status: number) {
  return NextResponse.json({ ok: false, reason }, { status });
}

function decodePoster(dataUrl: string): { mime: string; filename: string; content: string; bytes: number } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const content = match[2].replace(/\s/g, "");
  const pad = content.endsWith("==") ? 2 : content.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((content.length * 3) / 4) - pad;
  return {
    mime,
    filename: mime === "image/png" ? "poster.png" : "poster.jpg",
    content,
    bytes,
  };
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") || "0");
  if (length > MAX_BODY_BYTES) {
    return fail("This poster is too large to send. Try simplifying it.", 413);
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail("Invalid payload.", 400);
  }
  if (!body.email || !EMAIL_OK.test(body.email)) {
    return fail("A valid email is required.", 400);
  }
  if (!process.env.HBW_EMAIL_PROVIDER) {
    return NextResponse.json(
      {
        ok: false,
        status: "disabled",
        reason: "Email sending is disabled until a mail provider is configured.",
        received: {
          email: body.email,
          name: body.name || "",
          hasDecision: Boolean(body.decision),
          hasPoster: Boolean(body.poster),
        },
      },
      { status: 503 }
    );
  }
  if (process.env.HBW_EMAIL_PROVIDER !== "resend") {
    return fail("Provider adapter is not implemented.", 501);
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.HBW_EMAIL_FROM;
  const to = process.env.HBW_EMAIL_TO;
  if (!key || !from || !to) {
    return fail("Email sending is not fully configured.", 501);
  }

  const poster = typeof body.poster === "string" ? decodePoster(body.poster) : null;
  if (!poster) {
    return fail("A poster image is required.", 400);
  }
  if (poster.bytes > MAX_IMAGE_BYTES) {
    return fail("This poster is too large to send. Try simplifying it.", 413);
  }
  if (!allowIp(clientIp(request))) {
    return fail("Too many posters from this connection. Try again later.", 429);
  }

  const decision = (body.decision || "").trim();
  const subject = decision
    ? decision.split(/\r?\n/)[0]!.slice(0, 80)
    : `Poster from ${body.email}`;
  const text = [decision, `From: ${body.email}`].filter(Boolean).join("\n\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: body.email,
        subject,
        text,
        attachments: [
          {
            filename: poster.filename,
            content: poster.content,
            content_type: poster.mime,
          },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("resend failed", res.status, detail.slice(0, 400));
      return fail("The send did not go through. Try again.", 502);
    }
  } catch (error) {
    console.error("resend request failed", error);
    return fail("The send did not go through. Try again.", 502);
  }

  return NextResponse.json({ ok: true });
}
