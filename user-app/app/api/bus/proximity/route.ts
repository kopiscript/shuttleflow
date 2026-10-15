// app/api/bus/proximity/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/distance";
import { sendProximityAlert } from "@/lib/notifications";

const PROXIMITY_THRESHOLD = 500; // meters
const AT_PICKUP_RADIUS = 50;          // meters
const AT_PICKUP_DWELL_MS = 15_000;    // 15 seconds
const TRIP_DONE_RADIUS = 500;

type BusState = "approaching" | "at_pickup" | "en_route_to_dropoff" | "trip_done";

async function computeBusState(
  route: {
    id: number;
    pickupLat: number | null;
    pickupLng: number | null;
    dropoffLat: number | null;
    dropoffLng: number | null;
    arrivedAtPickupAt: Date | null;
  },
  busLat: number,
  busLng: number
): Promise<BusState> {
  if (!route.pickupLat || !route.pickupLng) return "approaching";

  const distanceToPickup = calculateDistance(
    busLat, busLng, route.pickupLat, route.pickupLng
  );
  const isAtPickup = distanceToPickup <= AT_PICKUP_RADIUS;
  const isWithinAlertZone = distanceToPickup <= PROXIMITY_THRESHOLD;

  let arrivedAtPickupAt = route.arrivedAtPickupAt;

  if (isAtPickup) {
    if (!arrivedAtPickupAt) {
      arrivedAtPickupAt = new Date();
      await prisma.route.update({
        where: { id: route.id },
        data: { arrivedAtPickupAt },
      });
    }
    const dwellMs = Date.now() - new Date(arrivedAtPickupAt).getTime();
    return dwellMs >= AT_PICKUP_DWELL_MS ? "at_pickup" : "approaching";
  }

  if (isWithinAlertZone) {
    return arrivedAtPickupAt ? "en_route_to_dropoff" : "approaching";
  }

  if (arrivedAtPickupAt) {
    await prisma.route.update({
      where: { id: route.id },
      data: {
        arrivedAtPickupAt: null,
        alertedForCurrentApproach: false,
      },
    });
    return "trip_done";
  }

  return "approaching";
}

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
        { success: false, error: "Route does not have pickup coordinates." },
        { status: 400 }
      );
    }

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

    let alertSent = false;
    let notificationId: number | null = null;
    let alertedNow = route.alertedForCurrentApproach;

    if (isNear && !route.alertedForCurrentApproach) {
      // Atomic compare-and-swap: only one instance wins the race
      const updated = await prisma.route.updateMany({
        where: {
          id: routeId,
          alertedForCurrentApproach: false,
        },
        data: { alertedForCurrentApproach: true },
      });

      if (updated.count === 1) {
        // We won the race → send the alert
        const notification = await sendProximityAlert(
          route.routeName,
          route.pickupStop,
          Math.round(distance)
        );
        alertSent = true;
        alertedNow = true;
        notificationId = notification.id;

        console.log(
          `🚌 [proximity] alert sent for ${route.routeName}: ${Math.round(
            distance
          )}m from ${route.pickupStop}`
        );
      } else {
        // Another instance beat us to it
        alertedNow = true;
        console.log(
          `⏭️ [proximity] skipped — another instance already alerted for ${route.routeName}`
        );
      }
    } else if (!isNear && route.alertedForCurrentApproach) {
      // Bus left the radius → reset for the next approach
      await prisma.route.update({
        where: { id: routeId },
        data: { alertedForCurrentApproach: false },
      });
      alertedNow = false;

      console.log(
        `↩️ [proximity] route ${route.routeName} left proximity zone, flag reset`
      );
    }

    // ✅ Compute bus state for the path-visibility rules
    const busState = await computeBusState(
      {
        id: route.id,
        pickupLat: route.pickupLat,
        pickupLng: route.pickupLng,
        dropoffLat: route.dropoffLat,
        dropoffLng: route.dropoffLng,
        arrivedAtPickupAt: route.arrivedAtPickupAt,
      },
      busLat,
      busLng
    );

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
        alertedForCurrentApproach: alertedNow,
        busState,   // ← NEW
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