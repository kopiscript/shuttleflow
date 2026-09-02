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

    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    // Get the latest location
    const busLocation = await prisma.location.findFirst({
      orderBy: { recordedAt: 'desc' },
      include: { bus: true }
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
          pickupStop: route.pickupStop || "Unknown",
          speed: null,
          source: "No GPS",
        },
        routeName: route.routeName,
      });
    }

    const busLat = parseFloat(busLocation.latitude.toString());
    const busLng = parseFloat(busLocation.longitude.toString());

    // Check if we have pickup coordinates
    if (!route.pickupLat || !route.pickupLng) {
      return NextResponse.json({
        success: false,
        error: "Route does not have pickup coordinates",
      }, { status: 400 });
    }

    let etaMinutes = 0;
    let distanceKm = 0;
    let source = "Haversine (fallback)";
    let routeSummary = null;
    let travelTimeInSeconds = 0;
    let speedKmh = 0;

    // ✅ 1. TRY TOMTOM API FIRST
    const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
    let tomtomSuccess = false;

    if (TOMTOM_API_KEY) {
      try {
        const url = `https://api.tomtom.com/routing/1/calculateRoute/${busLat},${busLng}:${route.pickupLat},${route.pickupLng}/json` +
          `?key=${TOMTOM_API_KEY}` +
          `&traffic=true` +
          `&routeType=fastest`;

        console.log("📍 TomTom API URL:", url);

        const response = await fetch(url);
        const data = await response.json();

        console.log("📍 TomTom Response Status:", response.status);

        if (data.routes && data.routes.length > 0) {
          travelTimeInSeconds = data.routes[0].summary.travelTimeInSeconds;
          etaMinutes = Math.ceil(travelTimeInSeconds / 60);
          distanceKm = data.routes[0].summary.lengthInMeters / 1000;
          source = "TomTom";
          routeSummary = data.routes[0].summary;
          tomtomSuccess = true;
          console.log(`✅ TomTom ETA: ${etaMinutes} min, ${distanceKm.toFixed(1)} km`);
        } else {
          console.log("⚠️ TomTom returned no routes, using fallback");
        }
      } catch (tomtomError) {
        console.error("❌ TomTom API error, using fallback:", tomtomError);
      }
    } else {
      console.log("⚠️ No TomTom API key, using fallback");
    }

    // ✅ 2. FALLBACK: Haversine + GPS Speed (ONLY if TomTom failed)
    if (!tomtomSuccess) {
      // Calculate distance using Haversine
      distanceKm = calculateDistance(busLat, busLng, route.pickupLat, route.pickupLng);

      // ✅ Try to get real GPS speed from database
      const rawSpeed = parseFloat(busLocation.speed?.toString() || "0");

      if (rawSpeed > 0) {
        // GPS speed available - use it!
        // Convert from m/s to km/h if needed (GPS usually gives km/h, but check)
        speedKmh = rawSpeed;

        // If speed is very low (< 10), it might be in m/s
        // Convert m/s to km/h (multiply by 3.6)
        if (rawSpeed < 10 && rawSpeed > 0) {
          speedKmh = rawSpeed * 3.6;
        }

        // If speed is still too low (< 5 km/h), the bus is probably stopped
        // Use a reasonable default based on distance
        if (speedKmh < 5) {
          if (distanceKm > 30) speedKmh = 60;
          else if (distanceKm > 10) speedKmh = 45;
          else if (distanceKm > 3) speedKmh = 30;
          else speedKmh = 20;
          console.log(`⚠️ GPS speed too low (${rawSpeed}), using estimated speed: ${speedKmh} km/h`);
        } else {
          console.log(`📍 Using GPS speed: ${speedKmh} km/h`);
        }
      } else {
        // No GPS speed - use estimated speed based on distance
        if (distanceKm > 30) speedKmh = 60;
        else if (distanceKm > 10) speedKmh = 45;
        else if (distanceKm > 3) speedKmh = 30;
        else speedKmh = 20;
        console.log(`📍 No GPS speed, using estimated speed: ${speedKmh} km/h`);
      }

      // Calculate ETA
      etaMinutes = Math.round((distanceKm / speedKmh) * 60);
      source = `Haversine (GPS speed: ${speedKmh.toFixed(1)} km/h)`;

      console.log(`📍 Haversine ETA: ${etaMinutes} min, ${distanceKm.toFixed(1)} km`);
    }

    // Calculate arrival time
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + etaMinutes * 60000);
    const arrivalTimeStr = arrivalTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Kuala_Lumpur',
    });

    // Format minutes left
    let minutesLeftStr = "";
    if (etaMinutes <= 0) {
      minutesLeftStr = "Arriving now";
    } else if (etaMinutes <= 1) {
      minutesLeftStr = "1 min away";
    } else if (etaMinutes < 60) {
      minutesLeftStr = `${etaMinutes} min away`;
    } else {
      const hours = Math.floor(etaMinutes / 60);
      const mins = etaMinutes % 60;
      minutesLeftStr = `${hours}h ${mins}m away`;
    }

    // Format distance
    let distanceDisplay = "";
    if (distanceKm < 1) {
      distanceDisplay = `${Math.round(distanceKm * 1000)}m`;
    } else {
      distanceDisplay = `${distanceKm.toFixed(1)} km`;
    }

    return NextResponse.json({
      success: true,
      eta: {
        minutes: etaMinutes,
        minutesDisplay: minutesLeftStr,
        arrivalTime: arrivalTimeStr,
        fullDisplay: `${minutesLeftStr} • Arrive at ${arrivalTimeStr}`,
        distance: distanceDisplay,
        pickupStop: route.pickupStop || "Unknown",
        speed: speedKmh ? `${speedKmh.toFixed(1)} km/h` : null,
        source: source,
        routeSummary: routeSummary,
        busLocation: { lat: busLat, lng: busLng },
        pickupLocation: { lat: route.pickupLat, lng: route.pickupLng },
      },
      routeName: route.routeName,
    });

  } catch (error) {
    console.error("ETA API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate ETA",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}