// app/api/routes/[id]/eta/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const INTI_SUBANG = { lat: 3.0742, lng: 101.5913 };
const INTI_NILAI = { lat: 2.8051, lng: 101.7656 };

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

    let eta = "Calculating...";
    let distanceKm = 0;
    let destination = "";
    let speedKmh = 0;

    if (busLocation) {
      const busLat = parseFloat(busLocation.latitude.toString());
      const busLng = parseFloat(busLocation.longitude.toString());
      
      // Get real speed
      const rawSpeed = parseFloat(busLocation.speed?.toString() || "0");
      // If speed is in m/s, convert to km/h
      speedKmh = rawSpeed * 3.6;
      
      // If speed is too low, use a reasonable default
      if (speedKmh < 5) {
        speedKmh = 50; // Average speed for this route
      }

      // Determine destination based on route
      if (routeId === 1) {
        // Subang to Nilai: destination is Nilai
        destination = "INTI Nilai";
        distanceKm = calculateDistance(busLat, busLng, INTI_NILAI.lat, INTI_NILAI.lng);
      } else if (routeId === 2) {
        // Nilai to Subang: destination is Subang
        destination = "INTI Subang";
        distanceKm = calculateDistance(busLat, busLng, INTI_SUBANG.lat, INTI_SUBANG.lng);
      } else {
        destination = "Unknown";
        distanceKm = 0;
      }

      // Calculate ETA
      const etaMinutes = Math.round((distanceKm / speedKmh) * 60);
      
      // Format ETA
      if (distanceKm === 0) {
        eta = "Calculating...";
      } else if (etaMinutes <= 1) {
        eta = "Less than 1 minute";
      } else if (etaMinutes < 60) {
        eta = `${etaMinutes} minutes`;
      } else {
        const hours = Math.floor(etaMinutes / 60);
        const mins = etaMinutes % 60;
        eta = `${hours}h ${mins}m`;
      }
    }

    return NextResponse.json({
      success: true,
      eta,
      distance: distanceKm ? `${distanceKm.toFixed(1)} km` : null,
      destination,
      speed: speedKmh ? `${speedKmh.toFixed(1)} km/h` : null,
      routeName: route.routeName,
    });
  } catch (error) {
    console.error("ETA API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate ETA" },
      { status: 500 }
    );
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}