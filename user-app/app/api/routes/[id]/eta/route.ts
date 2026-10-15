// app/api/routes/[id]/eta/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid route ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const to = searchParams.get("to") ?? "pickup";

    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    // Determine the destination coordinates based on `to`
    const destLat = to === "dropoff" ? route.dropoffLat : route.pickupLat;
    const destLng = to === "dropoff" ? route.dropoffLng : route.pickupLng;
    const destStop = to === "dropoff" ? route.dropoffStop : route.pickupStop;

    if (!destLat || !destLng) {
      return NextResponse.json(
        {
          success: false,
          error: `Route does not have ${to} coordinates`,
        },
        { status: 400 }
      );
    }

    // Find the bus assigned to this route
    const assignment = await prisma.busRouteAssignment.findFirst({
      where: { routeId, endedAt: null },
      include: { bus: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "No bus assigned to this route" },
        { status: 404 }
      );
    }

    const busLocation = await prisma.location.findFirst({
      where: { busId: assignment.busId },
      orderBy: { recordedAt: "desc" },
      include: { bus: true },
    });

    if (!busLocation) {
      return NextResponse.json({
        success: true,
        eta: {
          minutes: 0,
          minutesDisplay: "No GPS data",
          arrivalTime: "--:--",
          fullDisplay: "No GPS data",
          distance: "Unknown",
          pickupStop: destStop || "Unknown",
          speed: null,
          source: "No GPS",
          encodedPolyline: null,
        },
        routeName: route.routeName,
      });
    }

    const busLat = parseFloat(busLocation.latitude.toString());
    const busLng = parseFloat(busLocation.longitude.toString());

    let etaMinutes = 0;
    let distanceKm = 0;
    let source = "Haversine (fallback)";
    let routeSummary = null;
    let travelTimeInSeconds = 0;
    let speedKmh = 0;
    let encodedPolyline: unknown = null;

    // 1. TRY TOMTOM
    const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
    let tomtomSuccess = false;

    if (TOMTOM_API_KEY) {
      try {
        const url =
          `https://api.tomtom.com/routing/1/calculateRoute/` +
          `${busLat},${busLng}:${destLat},${destLng}/json` +
          `?key=${TOMTOM_API_KEY}` +
          `&traffic=true` +
          `&routeType=fastest` +
          `&routeRepresentation=polyline`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          travelTimeInSeconds = data.routes[0].summary.travelTimeInSeconds;
          etaMinutes = Math.ceil(travelTimeInSeconds / 60);
          distanceKm = data.routes[0].summary.lengthInMeters / 1000;
          source = "TomTom";
          routeSummary = data.routes[0].summary;
          tomtomSuccess = true;

          // ✅ Extract the polyline
          const rawPoints =
            data.routes[0]?.legs?.[0]?.points ??
            data.routes[0]?.geometry?.points ??
            null;

          if (Array.isArray(rawPoints) && rawPoints.length > 1) {
            encodedPolyline = rawPoints;
          } else if (typeof rawPoints === "string" && rawPoints.length > 0) {
            encodedPolyline = rawPoints;
          }
        }
      } catch (tomtomError) {
        console.error("❌ TomTom API error, using fallback:", tomtomError);
      }
    }

    // 2. FALLBACK
    if (!tomtomSuccess) {
      distanceKm = calculateDistance(busLat, busLng, destLat, destLng);

      const rawSpeed = parseFloat(busLocation.speed?.toString() || "0");

      if (rawSpeed > 0) {
        speedKmh = rawSpeed;
        if (rawSpeed < 10 && rawSpeed > 0) speedKmh = rawSpeed * 3.6;
        if (speedKmh < 5) {
          if (distanceKm > 30) speedKmh = 60;
          else if (distanceKm > 10) speedKmh = 45;
          else if (distanceKm > 3) speedKmh = 30;
          else speedKmh = 20;
        }
      } else {
        if (distanceKm > 30) speedKmh = 60;
        else if (distanceKm > 10) speedKmh = 45;
        else if (distanceKm > 3) speedKmh = 30;
        else speedKmh = 20;
      }

      etaMinutes = Math.round((distanceKm / speedKmh) * 60);
      source = `Haversine (GPS speed: ${speedKmh.toFixed(1)} km/h)`;
    }

    const now = new Date();
    const arrivalTime = new Date(now.getTime() + etaMinutes * 60000);
    const arrivalTimeStr = arrivalTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kuala_Lumpur",
    });

    let minutesLeftStr = "";
    if (etaMinutes <= 0) minutesLeftStr = "Arriving now";
    else if (etaMinutes <= 1) minutesLeftStr = "1 min away";
    else if (etaMinutes < 60) minutesLeftStr = `${etaMinutes} min away`;
    else {
      const hours = Math.floor(etaMinutes / 60);
      const mins = etaMinutes % 60;
      minutesLeftStr = `${hours}h ${mins}m away`;
    }

    let distanceDisplay = "";
    if (distanceKm < 1) distanceDisplay = `${Math.round(distanceKm * 1000)}m`;
    else distanceDisplay = `${distanceKm.toFixed(1)} km`;

    return NextResponse.json({
      success: true,
      eta: {
        minutes: etaMinutes,
        minutesDisplay: minutesLeftStr,
        arrivalTime: arrivalTimeStr,
        fullDisplay: `${minutesLeftStr} • Arrive at ${arrivalTimeStr}`,
        distance: distanceDisplay,
        pickupStop: destStop || "Unknown",
        speed: speedKmh ? `${speedKmh.toFixed(1)} km/h` : null,
        source,
        routeSummary,
        busLocation: { lat: busLat, lng: busLng },
        destinationLocation: { lat: destLat, lng: destLng },
        encodedPolyline,   // ← NEW
      },
      routeName: route.routeName,
    });
  } catch (error) {
    console.error("ETA API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate ETA",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}