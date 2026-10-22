import { NextResponse } from "next/server";
import { CONTACT_EMAIL } from "@/lib/contact";

/**
 * Someone writing to the studio from the front page.
 *
 * Sent through the same Resend account the Poster and the signup already
 * use — no second service and no second bill — with the sender's address as
 * reply-to, so answering is a reply rather than a copy and paste.
 *
 * If it cannot send, it says so and hands back the studio's address for the
 * form to show. A contact form that thanks someone and drops their message
 * is worse than one that admits it is not ready: the person walks away
 * believing they have been in touch.
 */
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Long enough for a real brief, short enough not to be a pipe. */
const MAX_SAY = 4000;
const MAX_NAME = 120;

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

/** Every failure hands back the address, so the form always has an answer. */
function fail(reason: string, status: number) {
  return NextResponse.json({ ok: false, reason, write: CONTACT_EMAIL }, { status });
}

export async function POST(request: Request) {
  let body: { name?: string; email?: string; say?: string; trap?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("That did not arrive in one piece.", 400);
  }

  /* A field no person can see and every crude bot fills in. */
  if (body.trap) return NextResponse.json({ ok: true });

  const email = (body.email || "").trim();
  const name = (body.name || "").trim().slice(0, MAX_NAME);
  const say = (body.say || "").trim();

  if (!EMAIL_OK.test(email) || email.length > 254) {
    return fail("That address does not look right.", 400);
  }
  if (!say) return fail("Say a little about what you need.", 400);
  if (say.length > MAX_SAY) return fail("That is longer than this form takes.", 413);
  if (!allowIp(clientIp(request))) {
    return fail("Too many messages from here. Try later, or write directly.", 429);
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.HBW_EMAIL_FROM;
  const to = process.env.HBW_EMAIL_TO || CONTACT_EMAIL;
  if (!key || !from) {
    /*
     * Not configured. 503 and the address, rather than a thank-you.
     *
     * This is the state the site is in until a mail provider is set, and it
     * is the one worth getting right — it is the failure nobody notices,
     * because to everybody involved it looks exactly like success.
     */
    return fail("The form is not sending yet. Write to the studio directly.", 503);
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "User-Agent": "hbw-website/1.0",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: name ? `${name} — from hbw.works` : `A message from ${email}`,
        text: [say, "", "—", name ? `${name} <${email}>` : email].join("\n"),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("talk: resend failed", res.status, detail.slice(0, 400));
      return fail("That did not go through. Write to the studio directly.", 502);
    }
  } catch (error) {
    console.error("talk: resend request failed", error);
    return fail("That did not go through. Write to the studio directly.", 502);
  }

  return NextResponse.json({ ok: true });
}
