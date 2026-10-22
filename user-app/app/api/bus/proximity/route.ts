// app/api/bus/proximity/route.ts — user-app
// The admin endpoint /api/admin/buses is the SINGLE source of truth for bus state.
// This endpoint only handles the proximity notification pipeline.

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeIdParam = searchParams.get("routeId");

    if (!routeIdParam) {
      return NextResponse.json(
        { success: false, error: "routeId is required" },
        { status: 400 }
      );
    }

    const routeId = parseInt(routeIdParam);
    if (isNaN(routeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid routeId" },
        { status: 400 }
      );
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        busAssignments: {
          where: { endedAt: null },
          include: { bus: true },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    if (!route.busAssignments[0]) {
      return NextResponse.json(
        { success: false, error: "No bus assigned to this route" },
        { status: 404 }
      );
    }

    if (route.pickupLat == null || route.pickupLng == null) {
      return NextResponse.json(
        { success: false, error: "Route does not have pickup coordinates" },
        { status: 400 }
      );
    }

    const bus = route.busAssignments[0].bus;

    const latestLocation = await prisma.location.findFirst({
      where: {
        busId: bus.id,
        NOT: { AND: [{ latitude: 0 }, { longitude: 0 }] },
      },
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

    // Haversine
    const R = 6371e3;
    const φ1 = (busLat * Math.PI) / 180;
    const φ2 = (route.pickupLat * Math.PI) / 180;
    const Δφ = ((route.pickupLat - busLat) * Math.PI) / 180;
    const Δλ = ((route.pickupLng - busLng) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceToPickup = R * c;

    const ALERT_RADIUS = 500;
    const isNearPickup = distanceToPickup <= ALERT_RADIUS;

    // Atomic CAS to prevent duplicate alerts across serverless instances
    let alertSent = false;
    if (isNearPickup && !route.alertedForCurrentApproach) {
      const updated = await prisma.route.updateMany({
        where: { id: routeId, alertedForCurrentApproach: false },
        data: { alertedForCurrentApproach: true },
      });
      if (updated.count === 1) {
        alertSent = true;
        // TODO: fire Pusher + email here (existing pipeline)
      }
    } else if (!isNearPickup && route.alertedForCurrentApproach) {
      // Bus left the radius — reset for next approach
      await prisma.route.updateMany({
        where: { id: routeId, alertedForCurrentApproach: true },
        data: { alertedForCurrentApproach: false },
      });
    }

    // Read busState from the admin API — do NOT recompute here
    // (avoids race with /api/admin/buses writes)
    // The frontend already polls /api/admin/buses separately if needed;
    // for the user app, we simply reflect the raw route state.
    // Since we removed state computation here, default to "approaching"
    // unless the route has already visited the pickup.
    const busState = route.arrivedAtPickupAt
      ? isNearPickup
        ? "at_pickup"
        : "en_route_to_dropoff"
      : "approaching";

    return NextResponse.json({
      success: true,
      data: {
        routeId,
        busId: bus.id,
        distanceToPickup: Math.round(distanceToPickup),
        isNearPickup,
        alertSent,
        alertedForCurrentApproach: route.alertedForCurrentApproach,
        busState,
        status: isNearPickup ? "approaching_pickup" : "far_from_pickup",
      },
    });
  } catch (error) {
    console.error("Failed to fetch proximity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch proximity" },
      { status: 500 }
    );
  }
}