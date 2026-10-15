// app/api/admin/buses/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";
import { getDeviceHealth } from "@/lib/deviceHealth";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";

// ---- Bus state machine constants ----
const AT_PICKUP_RADIUS = 50;          // meters — bus is "at" the pickup
const AT_PICKUP_DWELL_MS = 15_000;    // 15 seconds — must wait this long
const PROXIMITY_ALERT_RADIUS = 500;   // meters — for resetting state
const TRIP_DONE_RADIUS = 500;         // meters — how close to dropoff counts as "done"

type BusState = "approaching" | "at_pickup" | "en_route_to_dropoff" | "trip_done";

// Haversine distance in meters
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Compute the current state of a bus on its route. Also persists
 * `arrivedAtPickupAt` when the bus first enters the pickup radius, and
 * clears it when the bus leaves after having visited.
 */
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
    busLat,
    busLng,
    route.pickupLat,
    route.pickupLng
  );
  const isAtPickup = distanceToPickup <= AT_PICKUP_RADIUS;
  const isWithinAlertZone = distanceToPickup <= PROXIMITY_ALERT_RADIUS;

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

  // Outside 500m from pickup
  if (arrivedAtPickupAt) {
    // Trip cycle finished → reset for next approach
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
import { validateBusFields, hasErrors } from "@/lib/validation";

// GET - list all buses
export async function GET() {
  try {
    const buses = await prisma.bus.findMany({
      orderBy: { id: "asc" },
      include: {
        routeAssignments: {
          where: { endedAt: null },
          include: { route: true },
        },
        deviceAssignments: {
          where: { endedAt: null },
          include: { device: true },
        },
        locations: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
    });

    const transformed = await Promise.all(
      buses.map(async (bus) => {
        const activeRoute = bus.routeAssignments[0]?.route ?? null;
        const latestLocation = bus.locations[0] ?? null;
        const busLat = latestLocation ? Number(latestLocation.latitude) : null;
        const busLng = latestLocation ? Number(latestLocation.longitude) : null;

        // ✅ Compute bus state (needs both a route and a current location)
        let busState: BusState = "approaching";
        if (activeRoute && busLat !== null && busLng !== null) {
          busState = await computeBusState(
            {
              id: activeRoute.id,
              pickupLat: activeRoute.pickupLat,
              pickupLng: activeRoute.pickupLng,
              dropoffLat: activeRoute.dropoffLat,
              dropoffLng: activeRoute.dropoffLng,
              arrivedAtPickupAt: activeRoute.arrivedAtPickupAt,
            },
            busLat,
            busLng
          );
        }

        return {
          id: bus.id,
          busName: bus.busName,
          licensePlate: bus.licensePlate,
          capacity: bus.capacity,
          status: bus.status,
          createdAt: bus.createdAt,
          updatedAt: bus.updatedAt,

          // flat fields for the dashboard map / bus markers
          routeIds: bus.routeAssignments.map((a) => a.routeId),
          routeNames: bus.routeAssignments
            .map((a) => a.route?.routeName)
            .filter(Boolean),
          routeId: activeRoute?.id ?? null,
          routeName: activeRoute?.routeName ?? null,
          pickupStop: activeRoute?.pickupStop ?? null,
          dropoffStop: activeRoute?.dropoffStop ?? null,
          pickupLat: activeRoute?.pickupLat ?? null,
          pickupLng: activeRoute?.pickupLng ?? null,
          dropoffLat: activeRoute?.dropoffLat ?? null,
          dropoffLng: activeRoute?.dropoffLng ?? null,
          lat: busLat,
          lng: busLng,
          lastSeen: latestLocation?.recordedAt ?? null,

          // ✅ NEW — the bus state machine result
          busState,

          // existing nested shapes (kept for backwards compatibility)
          route: activeRoute,
          device: bus.deviceAssignments[0]?.device
            ? (() => {
                const device = bus.deviceAssignments[0].device;
                const health = getDeviceHealth(device.lastSeen);

                return {
                  ...device,
                  status: health.status,
                  lastLat: busLat,
                  lastLng: busLng,
                };
              })()
            : null,
        };
      })
    );

    return NextResponse.json({ success: true, buses: transformed });
  } catch (error) {
    console.error("Failed to fetch buses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch buses" },
      { status: 500 }
    );
  }
}

// POST - create a new bus (optionally assign a route and device)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { busName, licensePlate, capacity, status, routeId, deviceId } = body;
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Server-side field validation
    const validationErrors = validateBusFields({
      licensePlate: licensePlate || "",
      busName: busName || "",
      capacity: String(capacity ?? ""),
    });

    if (hasErrors(validationErrors)) {
      // Return the first error message
      const firstError = Object.values(validationErrors)[0];
      return NextResponse.json(
        { success: false, error: "Bus name and license plate are required" },
        { status: 400 }
      );
    }

    // ✅ Normalize values
    const normalizedPlate = licensePlate.trim().toUpperCase();
    const normalizedName = busName.trim();

    // ✅ Server-side guard: reject duplicate license plate
    const duplicatePlate = await prisma.bus.findFirst({
      where: { licensePlate: normalizedPlate },
    });

    if (duplicatePlate) {
      return NextResponse.json(
        {
          success: false,
          error: "A bus with this license plate already exists",
        },
        { status: 409 },
      );
    }

    // ✅ Normalize values
    const normalizedPlate = licensePlate.trim().toUpperCase();
    const normalizedName = busName.trim();

    // ✅ Server-side guard: reject duplicate license plate
    const duplicatePlate = await prisma.bus.findFirst({
      where: { licensePlate: normalizedPlate },
    });

    if (duplicatePlate) {
      return NextResponse.json(
        {
          success: false,
          error: "A bus with this license plate already exists",
        },
        { status: 409 },
      );
    }

    if (routeId) {
      const existingRouteAssignment = await prisma.busRouteAssignment.findFirst({
        where: { routeId: parseInt(routeId), endedAt: null },
      });

      if (existingRouteAssignment) {
        return NextResponse.json(
          {
            success: false,
            error: "This route is already assigned to another bus",
          },
          { status: 400 }
        );
      }
    }

    if (deviceId) {
      const existingDeviceAssignment =
        await prisma.busDeviceAssignment.findFirst({
          where: { deviceId: parseInt(deviceId), endedAt: null },
        });

      if (existingDeviceAssignment) {
        return NextResponse.json(
          {
            success: false,
            error: "This device is already assigned to another bus",
          },
          { status: 400 }
        );
      }
    }

    const bus = await prisma.bus.create({
      data: {
        busName: normalizedName,
        licensePlate: normalizedPlate,
        capacity: capacity ? parseInt(capacity) : null,
        status: status || "Active",
      },
    });

    await logActivity(
      bus.id,
      "bus_created",
      `Bus B${String(bus.id).padStart(3, "0")} created`
    );

    if (routeId) {
      await prisma.busRouteAssignment.create({
        data: {
          busId: bus.id,
          routeId: parseInt(routeId),
          assignedAt: new Date(),
        },
      });

      await logActivity(
        bus.id,
        "route_assigned",
        `Route assigned to Bus B${String(bus.id).padStart(3, "0")}`
      );
    }

    if (deviceId) {
      await prisma.busDeviceAssignment.create({
        data: {
          busId: bus.id,
          deviceId: parseInt(deviceId),
          assignedAt: new Date(),
        },
      });

      await logActivity(
        bus.id,
        "device_assigned",
        `Device assigned to Bus B${String(bus.id).padStart(3, "0")}`
      );
    }

    await logAdminAudit({
      adminId: session.adminId,
      category: "FLEET",
      action: "BUS_CREATED",
      targetType: "Bus",
      targetId: bus.id,
      details: {
        createdRecord: {
          id: bus.id,
          busName: bus.busName,
          licensePlate: bus.licensePlate,
          capacity: bus.capacity,
          status: bus.status,
          routeId: routeId ? Number(routeId) : null,
          deviceId: deviceId ? Number(deviceId) : null,
        },
      },
      req: request,
    });

    return NextResponse.json({ success: true, bus });
  } catch (error) {
    console.error("Failed to create bus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bus" },
      { status: 500 }
    );
  }
}