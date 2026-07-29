// app/api/bus/monitor/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/distance";
import { sendProximityAlert } from "@/lib/notifications";

const PROXIMITY_THRESHOLD = 500; // 500 meters
const ALERT_COOLDOWN = 120000; // 2 minutes

// Track last alert per route (in-memory)
const lastAlertSent: Record<number, number> = {};

export async function GET() {
  try {
    // 1. Get all active routes with coordinates
    const routes = await prisma.route.findMany({
      where: { 
        status: "Active",
        dropoffLat: { not: null },
        dropoffLng: { not: null },
      },
      include: { 
        busAssignments: {
          where: { endedAt: null },
          include: { bus: true }
        }
      }
    });

    const results = [];
    let alertsSent = 0;

    for (const route of routes) {
      // Skip if no assigned bus
      if (route.busAssignments.length === 0) continue;

      const busId = route.busAssignments[0].busId;

      // Get latest location for this bus
      const latestLocation = await prisma.location.findFirst({
        where: { busId },
        orderBy: { recordedAt: "desc" },
      });

      if (!latestLocation) continue;

      const busLat = Number(latestLocation.latitude);
      const busLng = Number(latestLocation.longitude);
      const destLat = route.dropoffLat!;
      const destLng = route.dropoffLng!;

      const distance = calculateDistance(busLat, busLng, destLat, destLng);
      const isNear = distance <= PROXIMITY_THRESHOLD;

      // Check cooldown
      const now = Date.now();
      const lastAlert = lastAlertSent[route.id] || 0;
      const canSendAlert = isNear && (now - lastAlert > ALERT_COOLDOWN);

      let alertSent = false;

      if (canSendAlert) {
        lastAlertSent[route.id] = now;
        await sendProximityAlert(
          route.routeName,
          route.dropoffStop,
          Math.round(distance)
        );
        alertSent = true;
        alertsSent++;
      }

      results.push({
        routeId: route.id,
        routeName: route.routeName,
        destination: route.dropoffStop,
        busId,
        distance: Math.round(distance),
        isNear,
        alertSent,
        cooldownRemaining: isNear && !canSendAlert 
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