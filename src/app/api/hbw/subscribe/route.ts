import { NextResponse } from "next/server";

/**
 * Keeping someone in the loop.
 *
 * Two ways, in order of preference, both using the Resend account the site
 * already sends the Poster through — no second service, no second bill.
 *
 *   1. RESEND_AUDIENCE_ID set: the address joins that audience, which is a
 *      real list that can be written to and unsubscribed from.
 *   2. Not set: the address is emailed to the studio instead, so a signup is
 *      never silently dropped while the list is being set up.
 *
 * If neither can run — no API key at all — it says so rather than pretending.
 * A form that thanks someone and throws their address away is worse than a
 * form that admits it is not ready.
 */
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_MAX = 4;
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

export async function POST(request: Request) {
  let body: { email?: string; trap?: string };
  try {
    body = (await request.json()) as { email?: string; trap?: string };
  } catch {
    return NextResponse.json({ ok: false, reason: "Bad request" }, { status: 400 });
  }

  // A field no person can see and every crude bot fills in.
  if (body.trap) return NextResponse.json({ ok: true });

  const email = (body.email || "").trim();
  if (!EMAIL_OK.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, reason: "That address does not look right." }, { status: 400 });
  }
  if (!allowIp(clientIp(request))) {
    return NextResponse.json({ ok: false, reason: "Too many tries. Try later." }, { status: 429 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, reason: "Signups are not switched on yet." },
      { status: 503 }
    );
  }

  const audience = process.env.RESEND_AUDIENCE_ID;
  try {
    if (audience) {
      const sent = await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
      // Already on the list is a success as far as the person is concerned.
      if (!sent.ok && sent.status !== 409) {
        return NextResponse.json({ ok: false, reason: "That did not go through." }, { status: 502 });
      }
      return NextResponse.json({ ok: true });
    }

    const from = process.env.HBW_EMAIL_FROM;
    const to = process.env.HBW_EMAIL_TO;
    if (!from || !to) {
      return NextResponse.json({ ok: false, reason: "Signups are not switched on yet." }, { status: 503 });
    }
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: "Someone asked to stay in the loop",
        text: `${email}\n\nAdd them to the list.`,
      }),
    });
    if (!sent.ok) {
      return NextResponse.json({ ok: false, reason: "That did not go through." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: "That did not go through." }, { status: 502 });
  }
}
