import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        routeAssignments: {
          where: { endedAt: null },
          include: { route: true },
        },
        deviceAssignments: {
          where: { endedAt: null },
          include: { device: true },
        },
      },
      orderBy: { id: "asc" },
    });

    const transformedBuses = buses.map((bus) => ({
      id: bus.id,
      busName: bus.busName,
      licensePlate: bus.licensePlate,
      capacity: bus.capacity,
      status: bus.status,
      route: bus.routeAssignments[0]?.route || null,
      device: bus.deviceAssignments[0]?.device || null,
    }));

    return NextResponse.json({ success: true, buses: transformedBuses });
  } catch (error) {
    console.error("Failed to fetch buses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch buses" },
      { status: 500 }
    );
  }
}

// POST - Create a new bus
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { busName, licensePlate, capacity, status, routeId, deviceId } = body;

    if (!busName || !licensePlate) {
      return NextResponse.json(
        { success: false, error: "Bus model and license plate are required" },
        { status: 400 }
      );
    }

    const parsedCapacity = capacity !== undefined && capacity !== null && capacity !== ""
      ? parseInt(capacity)
      : null;

    if (parsedCapacity !== null && isNaN(parsedCapacity)) {
      return NextResponse.json(
        { success: false, error: "Capacity must be a valid number" },
        { status: 400 }
      );
    }

    const bus = await prisma.bus.create({
      data: {
        busName,
        licensePlate,
        capacity: parsedCapacity,
        status: status || "Active",
      },
    });

    await logActivity(
      bus.id,
      "bus_created",
      `Bus B${String(bus.id).padStart(3, "0")} created`
    );

    if (routeId !== undefined && routeId !== null && routeId !== "") {
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

    if (deviceId !== undefined && deviceId !== null && deviceId !== "") {
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

    return NextResponse.json({ success: true, bus }, { status: 201 });
  } catch (error) {
    console.error("Failed to create bus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bus" },
      { status: 500 }
    );
  }
}