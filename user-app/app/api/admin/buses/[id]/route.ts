import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";
import { logActivity } from "@/lib/activityLog";
import { getDeviceHealth } from "@/lib/deviceHealth";

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

    const latestLocation = bus.locations[0] ?? null;

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
        ? (() => {
            const device = bus.deviceAssignments[0].device;
            // Derive status from the device's own lastSeen, so the
            // bus endpoints agree with the device endpoints.
            const health = getDeviceHealth(device.lastSeen);

            return {
              ...device,
              // override the raw column with the derived status
              status: health.status,
              // location-derived fields (for the map)
              lastLat: latestLocation?.latitude
                ? Number(latestLocation.latitude)
                : null,
              lastLng: latestLocation?.longitude
                ? Number(latestLocation.longitude)
                : null,
              // NOTE: lastSeen is the device's own lastSeen, not the
              // location's recordedAt.
            };
          })()
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
    // undefined = don't touch, null = unassign, number = assign
    if (routeId !== undefined) {
      // End any current active route assignment
      await prisma.busRouteAssignment.updateMany({
        where: { busId, endedAt: null },
        data: { endedAt: new Date() },
      });

      if (routeId !== null) {
        // Assign new route
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
      } else {
        await logActivity(
          busId,
          "route_assigned",
          `Route unassigned from Bus B${String(busId).padStart(3, "0")}`
        );
      }
    }

    // Handle device assignment
    // undefined = don't touch, null = unassign, number = assign
    if (deviceId !== undefined) {
      // End any current active device assignment
      await prisma.busDeviceAssignment.updateMany({
        where: { busId, endedAt: null },
        data: { endedAt: new Date() },
      });

      if (deviceId !== null) {
        // Assign new device
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
      } else {
        await logActivity(
          busId,
          "device_assigned",
          `Device unassigned from Bus B${String(busId).padStart(3, "0")}`
        );
      }
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const busId = parseInt(id);

    if (isNaN(busId)) {
      return NextResponse.json(
        { success: false, error: "Invalid bus ID" },
        { status: 400 }
      );
    }

    // 1. Fetch complete bus state and relationships before deletion
    const busToDelete = await prisma.bus.findUnique({
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

    if (!busToDelete) {
      return NextResponse.json(
        { success: false, error: "Bus not found" },
        { status: 404 }
      );
    }

    // 2. Save full snapshot into AdminAuditLog
    await logAdminAudit({
      adminId: session.adminId,
      category: "FLEET",
      action: "BUS_DELETED",
      targetType: "Bus",
      targetId: busId,
      details: {
        deletedRecord: {
          id: busToDelete.id,
          busName: busToDelete.busName,
          licensePlate: busToDelete.licensePlate,
          capacity: busToDelete.capacity,
          status: busToDelete.status,
          assignedRoute: busToDelete.routeAssignments[0]?.route || null,
          assignedDevice: busToDelete.deviceAssignments[0]?.device || null,
        },
      },
      req: request,
    });

    // 3. Clean up active assignments before deleting the bus
    await prisma.busRouteAssignment.updateMany({
      where: { busId, endedAt: null },
      data: { endedAt: new Date() },
    });

    await prisma.busDeviceAssignment.updateMany({
      where: { busId, endedAt: null },
      data: { endedAt: new Date() },
    });

    // 4. Delete the bus record
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