// app/api/admin/buses/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";

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

    const transformed = buses.map((bus) => {
      const activeRoute = bus.routeAssignments[0]?.route ?? null;
      const latestLocation = bus.locations[0] ?? null;

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
        routeNames: bus.routeAssignments.map((a) => a.route?.routeName).filter(Boolean),
        routeId: activeRoute?.id ?? null,
        routeName: activeRoute?.routeName ?? null,
        lat: latestLocation ? Number(latestLocation.latitude) : null,
        lng: latestLocation ? Number(latestLocation.longitude) : null,
        lastSeen: latestLocation?.recordedAt ?? null,

        // existing nested shapes (kept for backwards compatibility)
        route: activeRoute,
        device: bus.deviceAssignments[0]?.device
          ? {
              ...bus.deviceAssignments[0].device,
              lastLat: latestLocation?.latitude
                ? Number(latestLocation.latitude)
                : null,
              lastLng: latestLocation?.longitude
                ? Number(latestLocation.longitude)
                : null,
              // Override lastSeen with the actual last GPS signal time
              lastSeen: latestLocation?.recordedAt
                ? latestLocation.recordedAt.toISOString()
                : bus.deviceAssignments[0].device.lastSeen,
            }
          : null,
      };
    });

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
    const { busName, licensePlate, capacity, status, routeId, deviceId } =
      body;

    if (!busName || !licensePlate) {
      return NextResponse.json(
        { success: false, error: "Bus name and license plate are required" },
        { status: 400 }
      );
    }

    // Server-side guard: reject if the route is already assigned to another bus
    if (routeId) {
      const existingRouteAssignment =
        await prisma.busRouteAssignment.findFirst({
          where: { routeId: parseInt(routeId), endedAt: null },
        });

      if (existingRouteAssignment) {
        return NextResponse.json(
          { success: false, error: "This route is already assigned to another bus" },
          { status: 400 }
        );
      }
    }

    // Server-side guard: reject if the device is already assigned to another bus
    if (deviceId) {
      const existingDeviceAssignment =
        await prisma.busDeviceAssignment.findFirst({
          where: { deviceId: parseInt(deviceId), endedAt: null },
        });

      if (existingDeviceAssignment) {
        return NextResponse.json(
          { success: false, error: "This device is already assigned to another bus" },
          { status: 400 }
        );
      }
    }

    const bus = await prisma.bus.create({
      data: {
        busName,
        licensePlate,
        capacity: capacity ? parseInt(capacity) : null,
        status: status || "Active",
      },
    });

    await logActivity(
      bus.id,
      "bus_created",
      `Bus B${String(bus.id).padStart(3, "0")} created`
    );

    // Assign route if provided
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

    // Assign device if provided
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

    return NextResponse.json({ success: true, bus });
  } catch (error) {
    console.error("Failed to create bus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bus" },
      { status: 500 }
    );
  }
}