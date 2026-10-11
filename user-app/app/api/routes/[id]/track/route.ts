// app/api/routes/[id]/track/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/distance";

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

    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    // Find the bus currently assigned to this route
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

    const busId = assignment.busId;

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

    let distance: number | null = null;
    let isNear = false;

    if (route.pickupLat && route.pickupLng) {
      distance = calculateDistance(
        busLat,
        busLng,
        route.pickupLat,
        route.pickupLng
      );
      isNear = distance <= 500;
    }

    return NextResponse.json({
      success: true,
      data: {
        routeName: route.routeName,
        busId,
        busName: assignment.bus.busName,
        pickupStop: route.pickupStop,
        busLocation: { lat: busLat, lng: busLng },
        pickupLocation:
          route.pickupLat && route.pickupLng
            ? { lat: route.pickupLat, lng: route.pickupLng }
            : null,
        distanceToPickup: distance !== null ? Math.round(distance) : null,
        isNearPickup: isNear,
        status: isNear ? "approaching_pickup" : "en_route",
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