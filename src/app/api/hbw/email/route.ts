import { NextResponse } from "next/server";

type Body = {
  email?: string;
  name?: string;
  decision?: string;
  poster?: string;
};

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, reason: "Invalid payload." }, { status: 400 });
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ ok: false, reason: "A valid email is required." }, { status: 400 });
  }
  if (!process.env.HBW_EMAIL_PROVIDER) {
    return NextResponse.json(
      {
        ok: false,
        status: "disabled",
        reason: "Email sending is disabled until a mail provider is configured.",
        received: { email: body.email, name: body.name || "", hasDecision: Boolean(body.decision), hasPoster: Boolean(body.poster) },
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: false, reason: "Provider adapter is not implemented." }, { status: 501 });
}
