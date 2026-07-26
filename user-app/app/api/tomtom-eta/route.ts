import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startLat = searchParams.get("startLat");
  const startLng = searchParams.get("startLng");
  const endLat = searchParams.get("endLat");
  const endLng = searchParams.get("endLng");

  if (!startLat || !startLng || !endLat || !endLng) {
    return NextResponse.json(
      { success: false, error: "Missing coordinates" },
      { status: 400 }
    );
  }

  const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

  if (!TOMTOM_API_KEY) {
    return NextResponse.json(
      { success: false, error: "TomTom API key not configured" },
      { status: 500 }
    );
  }

  const url = `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLng}:${endLat},${endLng}/json` +
    `?key=${TOMTOM_API_KEY}` +
    `&traffic=true` +
    `&routeType=fastest`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const travelTimeInSeconds = data.routes[0].summary.travelTimeInSeconds;
      const travelTimeInMinutes = Math.ceil(travelTimeInSeconds / 60);
      const distanceInKm = (data.routes[0].summary.lengthInMeters / 1000).toFixed(1);

      let eta = "";
      if (travelTimeInMinutes <= 1) {
        eta = "Less than 1 minute";
      } else if (travelTimeInMinutes < 60) {
        eta = `${travelTimeInMinutes} minutes`;
      } else {
        const hours = Math.floor(travelTimeInMinutes / 60);
        const mins = travelTimeInMinutes % 60;
        eta = `${hours}h ${mins}m`;
      }

      return NextResponse.json({
        success: true,
        eta,
        travelTimeInSeconds,
        travelTimeInMinutes,
        distance: `${distanceInKm} km`,
        routeSummary: data.routes[0].summary,
      });
    }

    return NextResponse.json(
      { success: false, error: "No route found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("TomTom API Error:", error);
    return NextResponse.json(
      { success: false, error: "Routing request failed" },
      { status: 500 }
    );
  }
}