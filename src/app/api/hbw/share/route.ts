import { NextResponse } from "next/server";

export async function POST() {
  if (!process.env.HBW_SHARE_PROVIDER) {
    return NextResponse.json(
      {
        ok: false,
        status: "disabled",
        reason: "Poster hosting is not configured. WhatsApp can only carry text until an HBW storage endpoint exists.",
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: false, reason: "Storage adapter is not implemented." }, { status: 501 });
}
