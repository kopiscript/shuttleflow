// app/api/bus/monitor/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/distance";
import { sendProximityAlert } from "@/lib/notifications";

const PROXIMITY_THRESHOLD = 500; // 500 meters
const ALERT_COOLDOWN = 300000; // 5 minutes

// Track last alert per route (in-memory)
const lastAlertSent: Record<number, number> = {};

export async function GET() {
  try {
    // 1. Get all active routes with PICKUP coordinates
    const routes = await prisma.route.findMany({
      where: {
        status: "Active",
        pickupLat: { not: null },
        pickupLng: { not: null },
      },
      include: {
        busAssignments: {
          where: { endedAt: null },
          include: { bus: true },
        },
      },
    });

    const results = [];
    let alertsSent = 0;

    for (const route of routes) {
      if (route.busAssignments.length === 0) continue;

      const busId = route.busAssignments[0].busId;

      const latestLocation = await prisma.location.findFirst({
        where: { busId },
        orderBy: { recordedAt: "desc" },
      });

      if (!latestLocation) continue;

      const busLat = Number(latestLocation.latitude);
      const busLng = Number(latestLocation.longitude);
      // use pickup coordinates
      const pickupLat = route.pickupLat!;
      const pickupLng = route.pickupLng!;

      const distance = calculateDistance(busLat, busLng, pickupLat, pickupLng);
      const isNear = distance <= PROXIMITY_THRESHOLD;

      const now = Date.now();
      const lastAlert = lastAlertSent[route.id] || 0;
      const canSendAlert = isNear && now - lastAlert > ALERT_COOLDOWN;

      let alertSent = false;

      if (canSendAlert) {
        lastAlertSent[route.id] = now;
        // pass pickupStop instead of dropoffStop
        await sendProximityAlert(
          route.routeName,
          route.pickupStop,
          Math.round(distance)
        );
        alertSent = true;
        alertsSent++;
      }

      results.push({
        routeId: route.id,
        routeName: route.routeName,
        // report pickup info
        pickupStop: route.pickupStop,
        busId,
        distanceToPickup: Math.round(distance),
        isNearPickup: isNear,
        alertSent,
        cooldownRemaining:
          isNear && !canSendAlert
            ? Math.round((ALERT_COOLDOWN - (now - lastAlert)) / 1000)
            : 0,
      });
    }

    return NextResponse.json({
      success: true,
      routesChecked: routes.length,
      alertsSent,
      results,
    });
  } catch (error) {
    console.error("Monitor error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to monitor buses" },
      { status: 500 }
    );
  }
}
