// app/api/admin/buses/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";

// GET - Fetch a single bus
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const busId = parseInt(id);

    if (isNaN(busId)) {
      return NextResponse.json(
        { success: false, error: "Invalid bus ID" },
        { status: 400 }
      );
    }

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
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

    if (!bus) {
      return NextResponse.json(
        { success: false, error: "Bus not found" },
        { status: 404 }
      );
    }

    const transformedBus = {
      id: bus.id,
      busName: bus.busName,
      licensePlate: bus.licensePlate,
      capacity: bus.capacity,
      status: bus.status,
      createdAt: bus.createdAt,
      updatedAt: bus.updatedAt,
      route: bus.routeAssignments[0]?.route || null,
      device: bus.deviceAssignments[0]?.device
        ? {
            ...bus.deviceAssignments[0].device,
            lastLat: bus.locations[0]?.latitude
              ? parseFloat(bus.locations[0].latitude)
              : null,
            lastLng: bus.locations[0]?.longitude
              ? parseFloat(bus.locations[0].longitude)
              : null,
          }
        : null,
    };

    return NextResponse.json({ success: true, bus: transformedBus });
  } catch (error) {
    console.error("Failed to fetch bus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bus" },
      { status: 500 }
    );
  }
}

// PUT - Update a bus
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const busId = parseInt(id);
    const body = await request.json();
    const { busName, licensePlate, capacity, status, routeId, deviceId } = body;

    if (isNaN(busId)) {
      return NextResponse.json(
        { success: false, error: "Invalid bus ID" },
        { status: 400 }
      );
    }

    // Get old bus data for comparison
    const oldBus = await prisma.bus.findUnique({
      where: { id: busId },
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
    });

    if (!oldBus) {
      return NextResponse.json(
        { success: false, error: "Bus not found" },
        { status: 404 }
      );
    }

    // Update bus
    const bus = await prisma.bus.update({
      where: { id: busId },
      data: {
        busName,
        licensePlate,
        capacity: parseInt(capacity),
        status,
      },
    });

    // Log status change
    if (oldBus.status !== status) {
      await logActivity(
        busId,
        "status_changed",
        `Bus status changed from "${oldBus.status}" to "${status}"`
      );
    }

    // Handle route assignment
    if (routeId) {
      // End current route assignment
      await prisma.busRouteAssignment.updateMany({
        where: { busId, endedAt: null },
        data: { endedAt: new Date() },
      });

      // Create new route assignment
      await prisma.busRouteAssignment.create({
        data: {
          busId,
          routeId: parseInt(routeId),
          assignedAt: new Date(),
        },
      });

      await logActivity(
        busId,
        "route_assigned",
        `Route assigned to Bus B${String(busId).padStart(3, "0")}`
      );
    }

    // Handle device assignment
    if (deviceId) {
      // End current device assignment
      await prisma.busDeviceAssignment.updateMany({
        where: { busId, endedAt: null },
        data: { endedAt: new Date() },
      });

      // Create new device assignment
      await prisma.busDeviceAssignment.create({
        data: {
          busId,
          deviceId: parseInt(deviceId),
          assignedAt: new Date(),
        },
      });

      await logActivity(
        busId,
        "device_assigned",
        `Device assigned to Bus B${String(busId).padStart(3, "0")}`
      );
    }

    await logActivity(
      busId,
      "bus_updated",
      `Bus B${String(busId).padStart(3, "0")} details updated`
    );

    return NextResponse.json({ success: true, bus });
  } catch (error) {
    console.error("Failed to update bus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bus" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a bus
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const busId = parseInt(id);

    if (isNaN(busId)) {
      return NextResponse.json(
        { success: false, error: "Invalid bus ID" },
        { status: 400 }
      );
    }

    // Log the deletion
    await logActivity(
      busId,
      "bus_deleted",
      `Bus B${String(busId).padStart(3, "0")} deleted from system`
    );

    // Delete the bus (cascade will handle related records)
    await prisma.bus.delete({
      where: { id: busId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete bus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete bus" },
      { status: 500 }
    );
  }
}