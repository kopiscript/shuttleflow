// app/api/bus/proximity/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/distance";
import { sendProximityAlert } from "@/lib/notifications";

// Configuration - adjust as needed
const PROXIMITY_THRESHOLD = 500; // 500 meters
const ALERT_COOLDOWN = 120000; // 2 minutes (prevent spam)

// Track last alert sent per route (in-memory, resets on server restart)
// For production, use a database table or Redis
const lastAlertSent: Record<number, number> = {};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busId = parseInt(searchParams.get("busId") || "1");
    const routeId = parseInt(searchParams.get("routeId") || "0");

    if (!routeId) {
      return NextResponse.json(
        { success: false, error: "routeId is required" },
        { status: 400 }
      );
    }

    // 1. Get the route with destination coordinates
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    if (!route.dropoffLat || !route.dropoffLng) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Route does not have destination coordinates. Please update the route." 
        },
        { status: 400 }
      );
    }

    // 2. Get the latest location for this bus
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
    const destLat = route.dropoffLat;
    const destLng = route.dropoffLng;

    // 3. Calculate distance
    const distance = calculateDistance(busLat, busLng, destLat, destLng);
    const isNear = distance <= PROXIMITY_THRESHOLD;

    // 4. Check cooldown (prevent spam)
    const now = Date.now();
    const lastAlert = lastAlertSent[routeId] || 0;
    const canSendAlert = isNear && (now - lastAlert > ALERT_COOLDOWN);

    // 5. Send notification if conditions met
    let alertSent = false;
    let notificationId = null;

    if (canSendAlert) {
      // Update last alert time
      lastAlertSent[routeId] = now;

      // Send notification
      const notification = await sendProximityAlert(
        route.routeName,
        route.dropoffStop,
        Math.round(distance)
      );
      
      alertSent = true;
      notificationId = notification.id;

      console.log(`🚌 Proximity alert sent for ${route.routeName}: ${Math.round(distance)}m from destination`);
    }

    return NextResponse.json({
      success: true,
      data: {
        routeId: route.id,
        routeName: route.routeName,
        destination: route.dropoffStop,
        busLocation: { lat: busLat, lng: busLng },
        destinationLocation: { lat: destLat, lng: destLng },
        distanceToDestination: Math.round(distance),
        isNearDestination: isNear,
        threshold: PROXIMITY_THRESHOLD,
        alertSent,
        notificationId,
        cooldownRemaining: isNear && !canSendAlert 
          ? Math.round((ALERT_COOLDOWN - (now - lastAlert)) / 1000) 
          : 0,
        status: isNear ? "approaching" : "en_route",
      },
    });
  } catch (error) {
    console.error("Proximity check error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to check proximity" 
      },
      { status: 500 }
    );
  }
}