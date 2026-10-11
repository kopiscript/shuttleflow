// app/api/bus/monitor/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/distance";
import { sendProximityAlert } from "@/lib/notifications";

const PROXIMITY_THRESHOLD = 500; // meters

// Module-level state: tracks which routes are currently inside the
// 500m radius and have already had an alert sent for this approach.
// Key = routeId, Value = true means "alert already sent for current entry".
// Reset to false when the bus leaves the radius, so the next entry fires again.
const alertedRoutes: Record<number, boolean> = {};

export async function GET() {
  try {
    // 1. Get all active routes with pickup coordinates
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
      const pickupLat = route.pickupLat!;
      const pickupLng = route.pickupLng!;

      const distance = calculateDistance(busLat, busLng, pickupLat, pickupLng);
      const isNear = distance <= PROXIMITY_THRESHOLD;

      // ✅ Rising-edge detection (same as /api/bus/proximity)
      const wasAlreadyAlerted = alertedRoutes[route.id] === true;

      let alertSent = false;

      if (isNear && !wasAlreadyAlerted) {
        // Bus just entered the radius → send one alert
        alertedRoutes[route.id] = true;

        await sendProximityAlert(
          route.routeName,
          route.pickupStop,
          Math.round(distance)
        );

        alertSent = true;
        alertsSent++;

        console.log(
          `🚌 Pickup proximity alert sent for ${route.routeName}: ${Math.round(
            distance
          )}m from ${route.pickupStop}`
        );
      } else if (!isNear && wasAlreadyAlerted) {
        // Bus left the radius → reset for the next approach
        alertedRoutes[route.id] = false;

        console.log(
          `↩️ Route ${route.routeName} left the proximity zone. Ready for next approach.`
        );
      }

      results.push({
        routeId: route.id,
        routeName: route.routeName,
        pickupStop: route.pickupStop,
        busId,
        distanceToPickup: Math.round(distance),
        isNearPickup: isNear,
        alertSent,
        // ✅ Expose whether an alert has already fired for this approach
        alertedForCurrentApproach: alertedRoutes[route.id] === true,
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