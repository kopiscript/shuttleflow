import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const originLat = searchParams.get("originLat");
    const originLng = searchParams.get("originLng");
    const destLat = searchParams.get("destLat");
    const destLng = searchParams.get("destLng");

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 });
    }

    const key = process.env.TOMTOM_API_KEY;
    if (!key) {
      return NextResponse.json({ success: false, error: "TomTom key not configured" }, { status: 500 });
    }

    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/` +
      `${originLat},${originLng}:${destLat},${destLng}/json` +
      `?key=${key}&traffic=true&travelMode=car`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: "TomTom request failed" }, { status: 502 });
    }

    const data = await res.json();
    const summary = data?.routes?.[0]?.summary;
    if (!summary) {
      return NextResponse.json({ success: false, error: "No route found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      travelTimeSeconds: summary.travelTimeInSeconds,
      distanceMeters: summary.lengthInMeters,
      trafficDelaySeconds: summary.trafficDelayInSeconds ?? 0,
    });
  } catch (err) {
    console.error("ETA error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch ETA" }, { status: 500 });
  }
}