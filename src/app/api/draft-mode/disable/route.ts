import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  (await draftMode()).disable();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/", origin));
}
