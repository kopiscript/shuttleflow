// app/api/bus/proximity/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/distance";
import { sendProximityAlert } from "@/lib/notifications";

const PROXIMITY_THRESHOLD = 500;   // meters
const ALERT_COOLDOWN = 120000;     // 2 minutes

const lastAlertSent: Record<number, number> = {};

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

    const now = Date.now();
    const lastAlert = lastAlertSent[routeId] || 0;
    const canSendAlert = isNear && now - lastAlert > ALERT_COOLDOWN;

    let alertSent = false;
    let notificationId: number | null = null;

    if (canSendAlert) {
      lastAlertSent[routeId] = now;

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
        cooldownRemaining:
          isNear && !canSendAlert
            ? Math.round((ALERT_COOLDOWN - (now - lastAlert)) / 1000)
            : 0,
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