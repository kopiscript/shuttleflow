// app/api/routes/[id]/track/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/distance";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const busId = parseInt(searchParams.get("busId") || "1");

    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    const latestLocation = await prisma.location.findFirst({
      where: { busId },
      orderBy: { recordedAt: "desc" },
    });

    if (!latestLocation) {
      return NextResponse.json(
        { success: false, error: "Bus location not found" },
        { status: 404 }
      );
    }

    const busLat = Number(latestLocation.latitude);
    const busLng = Number(latestLocation.longitude);

    let distance = null;
    let isNear = false;
    let destination = null;

    if (route.dropoffLat && route.dropoffLng) {
      const destLat = route.dropoffLat;
      const destLng = route.dropoffLng;
      distance = calculateDistance(busLat, busLng, destLat, destLng);
      isNear = distance <= 500;
      destination = route.dropoffStop;
    }

    return NextResponse.json({
      success: true,
      data: {
        routeName: route.routeName,
        destination: destination,
        busLocation: { lat: busLat, lng: busLng },
        destinationLocation: route.dropoffLat && route.dropoffLng 
          ? { lat: route.dropoffLat, lng: route.dropoffLng }
          : null,
        distanceToDestination: distance ? Math.round(distance) : null,
        isNearDestination: isNear,
        status: isNear ? "approaching" : "en_route",
      },
    });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track bus" },
      { status: 500 }
    );
  }
}