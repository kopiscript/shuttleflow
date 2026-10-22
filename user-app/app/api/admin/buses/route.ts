// app/api/admin/buses/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";
import { getDeviceHealth } from "@/lib/deviceHealth";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";
import { validateBusFields, hasErrors } from "@/lib/validation";

// ---- Bus state machine constants ----
const AT_PICKUP_RADIUS = 50;          // meters — bus is "at" the pickup
const AT_DROPOFF_RADIUS = 50;         // meters — bus is "at" the drop-off
const AT_PICKUP_DWELL_MS = 15_000;    // 15 seconds — must wait this long

type BusState = "approaching" | "at_pickup" | "en_route_to_dropoff" | "trip_done";

interface BusStateResult {
  state: BusState;
  shouldSetArrival: boolean;
  shouldReset: boolean;
  distanceToPickup: number;
  distanceToDropoff: number | null;
}

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
 * Compute the current state of a bus on its route (pure — no DB writes).
 * The caller decides whether to persist `arrivedAtPickupAt` changes.
 *
 * State rules:
 *   - approaching       : hasn't visited the pickup yet (or just arrived, < 15s dwell)
 *   - at_pickup         : inside pickup radius for >= 15s
 *   - en_route_to_dropoff : left pickup, hasn't reached dropoff yet
 *   - trip_done         : reached dropoff (reset for next trip)
 */
function computeBusState(
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
): BusStateResult {
  // Null-safe (allows 0 coordinates to pass through)
  if (route.pickupLat == null || route.pickupLng == null) {
    return {
      state: "approaching",
      shouldSetArrival: false,
      shouldReset: false,
      distanceToPickup: -1,
      distanceToDropoff: null,
    };
  }

  const distanceToPickup = calculateDistance(
    busLat,
    busLng,
    route.pickupLat,
    route.pickupLng
  );

  const distanceToDropoff =
    route.dropoffLat != null && route.dropoffLng != null
      ? calculateDistance(busLat, busLng, route.dropoffLat, route.dropoffLng)
      : null;

  const isAtPickup = distanceToPickup <= AT_PICKUP_RADIUS;
  const isAtDropoff =
    distanceToDropoff !== null && distanceToDropoff <= AT_DROPOFF_RADIUS;

  // ---- 1. At the pickup ----
  if (isAtPickup) {
    if (!route.arrivedAtPickupAt) {
      // First entry — signal caller to record arrival
      return {
        state: "approaching",
        shouldSetArrival: true,
        shouldReset: false,
        distanceToPickup,
        distanceToDropoff,
      };
    }
    const dwellMs = Date.now() - new Date(route.arrivedAtPickupAt).getTime();
    return {
      state: dwellMs >= AT_PICKUP_DWELL_MS ? "at_pickup" : "approaching",
      shouldSetArrival: false,
      shouldReset: false,
      distanceToPickup,
      distanceToDropoff,
    };
  }

  // ---- 2. At the drop-off (trip genuinely finished) ----
  if (isAtDropoff && route.arrivedAtPickupAt) {
    return {
      state: "trip_done",
      shouldSetArrival: false,
      shouldReset: true,
      distanceToPickup,
      distanceToDropoff,
    };
  }

  // ---- 3. Has visited pickup, not yet at dropoff → en route ----
  //   Regardless of how far from the pickup, if the bus has visited the
  //   pickup and hasn't reached the dropoff, it's on its way to the dropoff.
  if (route.arrivedAtPickupAt) {
    return {
      state: "en_route_to_dropoff",
      shouldSetArrival: false,
      shouldReset: false,
      distanceToPickup,
      distanceToDropoff,
    };
  }

  // ---- 4. Hasn't visited pickup yet ----
  return {
    state: "approaching",
    shouldSetArrival: false,
    shouldReset: false,
    distanceToPickup,
    distanceToDropoff,
  };
}

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
          where: {
            NOT: {
              AND: [{ latitude: 0 }, { longitude: 0 }],
            },
          },
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

        // Compute bus state (needs both a route and a current location)
        let busState: BusState = "approaching";
        if (activeRoute && busLat !== null && busLng !== null) {
          const result = computeBusState(
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

          // Persist side effects here (single writer, no races)
          if (result.shouldSetArrival) {
            await prisma.route.update({
              where: { id: activeRoute.id },
              data: { arrivedAtPickupAt: new Date() },
            });
          } else if (result.shouldReset) {
            await prisma.route.update({
              where: { id: activeRoute.id },
              data: {
                arrivedAtPickupAt: null,
                alertedForCurrentApproach: false,
              },
            });
          }

          busState = result.state;
        }

        return {
          id: bus.id,
          busName: bus.busName,
          licensePlate: bus.licensePlate,
          capacity: bus.capacity,
          status: bus.status,
          driverName: bus.driverName,
          driverPhone: bus.driverPhone,
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

          // the bus state machine result
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
    const {
      busName,
      licensePlate,
      capacity,
      status,
      routeId,
      deviceId,
      driverName,
      driverPhone,
    } = body;
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Server-side field validation
    const validationErrors = validateBusFields({
      licensePlate: licensePlate || "",
      busName: busName || "",
      capacity: String(capacity ?? ""),
      driverName: driverName ?? "",
      driverPhone: driverPhone ?? "",
    });

    if (hasErrors(validationErrors)) {
      const firstError = Object.values(validationErrors)[0];
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    // Normalize values (ONCE)
    const normalizedPlate = licensePlate.trim().toUpperCase();
    const normalizedName = busName.trim();
    const normalizedDriverName = driverName?.trim() || null;
    const normalizedDriverPhone = driverPhone?.trim() || null;

    // Server-side guard: reject duplicate license plate
    const duplicatePlate = await prisma.bus.findFirst({
      where: { licensePlate: normalizedPlate },
    });

    if (duplicatePlate) {
      return NextResponse.json(
        { success: false, error: "A bus with this license plate already exists" },
        { status: 409 }
      );
    }

    // Server-side guard: reject if the route is already assigned
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

    // Server-side guard: reject if the device is already assigned
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
        driverName: normalizedDriverName,
        driverPhone: normalizedDriverPhone,
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
          driverName: bus.driverName,
          driverPhone: bus.driverPhone,
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