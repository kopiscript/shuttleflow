// app/api/bus/proximity/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/distance";
import { sendProximityAlert } from "@/lib/notifications";

const PROXIMITY_THRESHOLD = 500; // meters

// Module-level state: tracks which routes are currently "inside" the
// 500m radius and have already had an alert sent for this approach.
// Key = routeId, Value = true means "alert already sent for current entry".
// Reset to false when the bus leaves the radius, so the next entry fires again.
const alertedRoutes: Record<number, boolean> = {};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = parseInt(searchParams.get("routeId") || "0");

    if (!routeId) {
      return NextResponse.json(
        { success: false, error: "routeId is required" },
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

    if (!route.pickupLat || !route.pickupLng) {
      return NextResponse.json(
        {
          success: false,
          error: "Route does not have pickup coordinates.",
        },
        { status: 400 }
      );
    }

    // Derive the assigned bus
    const assignment = await prisma.busRouteAssignment.findFirst({
      where: { routeId, endedAt: null },
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
    const pickupLat = route.pickupLat;
    const pickupLng = route.pickupLng;

    const distance = calculateDistance(busLat, busLng, pickupLat, pickupLng);
    const isNear = distance <= PROXIMITY_THRESHOLD;

    // rising-edge detection
    const wasAlreadyAlerted = alertedRoutes[routeId] === true;

    let alertSent = false;
    let notificationId: number | null = null;

    if (isNear && !wasAlreadyAlerted) {
      // Bus just entered the radius → send the alert once
      alertedRoutes[routeId] = true;

      const notification = await sendProximityAlert(
        route.routeName,
        route.pickupStop,
        Math.round(distance)
      );

      alertSent = true;
      notificationId = notification.id;

      console.log(
        `🚌 Pickup proximity alert sent for ${route.routeName}: ${Math.round(
          distance
        )}m from ${route.pickupStop}`
      );
    } else if (!isNear && wasAlreadyAlerted) {
      // Bus left the radius → reset so the next approach fires again
      alertedRoutes[routeId] = false;

      console.log(
        `↩️ Route ${route.routeName} left the proximity zone. Ready for next approach.`
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        routeId: route.id,
        routeName: route.routeName,
        busId,
        pickupStop: route.pickupStop,
        busLocation: { lat: busLat, lng: busLng },
        pickupLocation: { lat: pickupLat, lng: pickupLng },
        distanceToPickup: Math.round(distance),
        isNearPickup: isNear,
        threshold: PROXIMITY_THRESHOLD,
        alertSent,
        notificationId,
        // Expose whether an alert has already fired for this approach
        alertedForCurrentApproach: alertedRoutes[routeId] === true,
        status: isNear ? "approaching_pickup" : "en_route",
      },
    });
  } catch (error) {
    console.error("Proximity check error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to check proximity",
      },
      { status: 500 }
    );
  }
}