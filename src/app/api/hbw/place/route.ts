import { NextResponse } from "next/server";

const LAT = -33.7106;
const LON = 150.3753;
const PLACE = "Wentworth Falls, Blue Mountains";
const SOURCE = "https://api.open-meteo.com/v1/forecast";

function conditionFromCode(code: number) {
  if (code === 0) return "Clear";
  if (code === 1 || code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "Snow";
  if (code >= 95) return "Storm";
  return "Cloudy";
}

export async function GET() {
  try {
    const url = `${SOURCE}?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Australia%2FSydney`;
    const response = await fetch(url, { next: { revalidate: 600 } });
    if (!response.ok) {
      console.error("HBW place: Open-Meteo HTTP", response.status);
      return NextResponse.json({ ok: false, place: PLACE }, { status: 200 });
    }
    const body = (await response.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const temperature = body.current?.temperature_2m;
    const code = body.current?.weather_code;
    if (typeof temperature !== "number" || typeof code !== "number") {
      return NextResponse.json({ ok: false, place: PLACE }, { status: 200 });
    }
    return NextResponse.json(
      {
        ok: true,
        place: PLACE,
        temperature: Math.round(temperature),
        condition: conditionFromCode(code),
        source: "open-meteo",
      },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } }
    );
  } catch (error) {
    console.error("HBW place: Open-Meteo failed", error);
    return NextResponse.json({ ok: false, place: PLACE }, { status: 200 });
  }
}
