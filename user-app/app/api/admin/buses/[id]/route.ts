// app/api/admin/buses/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";
import { logActivity } from "@/lib/activityLog";
import { getDeviceHealth } from "@/lib/deviceHealth";
import { sendAlertNotification, sendInfo } from "@/lib/notifications";
import { validateBusFields, hasErrors } from "@/lib/validation";

// GET - Fetch a single bus
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const busId = parseInt(id);

    if (isNaN(busId)) {
      return NextResponse.json(
        { success: false, error: "Invalid bus ID" },
        { status: 400 },
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
        { status: 404 },
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
            const health = getDeviceHealth(device.lastSeen);

            return {
              ...device,
              status: health.status,
              lastLat: latestLocation?.latitude
                ? Number(latestLocation.latitude)
                : null,
              lastLng: latestLocation?.longitude
                ? Number(latestLocation.longitude)
                : null,
            };
          })()
        : null,
    };

    return NextResponse.json({ success: true, bus: transformedBus });
  } catch (error) {
    console.error("Failed to fetch bus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bus" },
      { status: 500 },
    );
  }
}

// PUT - Update a bus
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const busId = parseInt(id);
    const body = await request.json();
    const { busName, licensePlate, capacity, status, routeId, deviceId } = body;
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (isNaN(busId)) {
      return NextResponse.json(
        { success: false, error: "Invalid bus ID" },
        { status: 400 },
      );
    }

    // ✅ Server-side field validation
    const validationErrors = validateBusFields({
      licensePlate: licensePlate || "",
      busName: busName || "",
      capacity: String(capacity ?? ""),
    });

    if (hasErrors(validationErrors)) {
      const firstError = Object.values(validationErrors)[0];
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 },
      );
    }

    // ✅ Normalize values
    const normalizedPlate = licensePlate.trim().toUpperCase();
    const normalizedName = busName.trim();

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
        { status: 404 },
      );
    }

    // ✅ Server-side guard: reject duplicate license plate (excluding self)
    const duplicatePlate = await prisma.bus.findFirst({
      where: {
        licensePlate: normalizedPlate,
        NOT: { id: busId },
      },
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

    // Update bus
    const bus = await prisma.bus.update({
      where: { id: busId },
      data: {
        busName: normalizedName,
        licensePlate: normalizedPlate,
        capacity: parseInt(capacity),
        status,
      },
    });

    // Log status change
    if (oldBus.status !== status) {
      await logActivity(
        busId,
        "status_changed",
        `Bus status changed from "${oldBus.status}" to "${status}"`,
      );
    }

    // ✅ Notifications + route status sync on status transitions
    if (status !== undefined && status !== oldBus.status) {
      const activeRoute = oldBus.routeAssignments[0]?.route ?? null;
      const routeLabel = activeRoute?.routeName ?? "its route";

      // → Breakdown: notify users, but do NOT change route status.
      //   The bus is momentarily out of service; the route is still
      //   operational once the issue is resolved.
      if (status === "Breakdown") {
        await sendAlertNotification(
          `${oldBus.busName} Breakdown`,
          `${oldBus.busName} on ${routeLabel} has broken down. Please take alternative transport.`,
        );
        console.log(`🚨 Breakdown notification sent for ${oldBus.busName}`);
      }

      // → Back to Active: recovery notification (only if coming from
      //   a non-Active state). Also reactivate the route if it was
      //   previously deactivated by an Inactive transition.
      else if (status === "Active" && oldBus.status !== "Active") {
        await sendInfo(
          `${oldBus.busName} Back in Service`,
          `${oldBus.busName} on ${routeLabel} is back on the road. Thank you for your patience.`,
        );
        console.log(`✅ Recovery notification sent for ${oldBus.busName}`);

        // Reactivate the route if the bus was previously Inactive
        if (oldBus.status === "Inactive" && activeRoute) {
          await prisma.route.update({
            where: { id: activeRoute.id },
            data: { status: "Active" },
          });
          await logActivity(
            busId,
            "status_changed",
            `Route "${routeLabel}" reactivated because bus is now Active`,
          );
        }
      }

      // → Inactive: silence the route (hide it from the user app).
      //   No notification — the route disappearing is the signal.
      else if (status === "Inactive") {
        if (activeRoute) {
          await prisma.route.update({
            where: { id: activeRoute.id },
            data: { status: "Inactive" },
          });
          await logActivity(
            busId,
            "status_changed",
            `Route "${routeLabel}" deactivated because bus is Inactive`,
          );
          console.log(
            `🔇 Route ${routeLabel} deactivated — bus ${oldBus.busName} is Inactive`,
          );
        }
      }
    }

    // Handle route assignment
    // undefined = don't touch, null = unassign, number = assign
    if (routeId !== undefined) {
      await prisma.busRouteAssignment.updateMany({
        where: { busId, endedAt: null },
        data: { endedAt: new Date() },
      });

      if (routeId !== null) {
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
          `Route assigned to Bus B${String(busId).padStart(3, "0")}`,
        );
      } else {
        await logActivity(
          busId,
          "route_assigned",
          `Route unassigned from Bus B${String(busId).padStart(3, "0")}`,
        );
      }
    }

    // Handle device assignment
    if (deviceId !== undefined) {
      await prisma.busDeviceAssignment.updateMany({
        where: { busId, endedAt: null },
        data: { endedAt: new Date() },
      });

      if (deviceId !== null) {
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
          `Device assigned to Bus B${String(busId).padStart(3, "0")}`,
        );
      } else {
        await logActivity(
          busId,
          "device_assigned",
          `Device unassigned from Bus B${String(busId).padStart(3, "0")}`,
        );
      }
    }

    await logActivity(
      busId,
      "bus_updated",
      `Bus B${String(busId).padStart(3, "0")} details updated`,
    );

    const updatedBus = await prisma.bus.findUniqueOrThrow({
      where: { id: busId },
      include: {
        routeAssignments: {
          where: { endedAt: null },
        },
        deviceAssignments: {
          where: { endedAt: null },
        },
      },
    });

    await logAdminAudit({
      adminId: session.adminId,
      category: "FLEET",
      action: "BUS_UPDATED",
      targetType: "Bus",
      targetId: busId,
      details: {
        before: {
          id: oldBus.id,
          busName: oldBus.busName,
          licensePlate: oldBus.licensePlate,
          capacity: oldBus.capacity,
          status: oldBus.status,
          routeIds: oldBus.routeAssignments.map((a) => a.routeId),
          deviceIds: oldBus.deviceAssignments.map((a) => a.deviceId),
        },
        after: {
          id: updatedBus.id,
          busName: updatedBus.busName,
          licensePlate: updatedBus.licensePlate,
          capacity: updatedBus.capacity,
          status: updatedBus.status,
          routeIds: updatedBus.routeAssignments.map((a) => a.routeId),
          deviceIds: updatedBus.deviceAssignments.map((a) => a.deviceId),
        },
      },
      req: request,
    });

    return NextResponse.json({ success: true, bus });
  } catch (error) {
    console.error("Failed to update bus:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bus" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a bus
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const busId = parseInt(id);

    if (isNaN(busId)) {
      return NextResponse.json(
        { success: false, error: "Invalid bus ID" },
        { status: 400 },
      );
    }

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
        { status: 404 },
      );
    }

    // Delete all related records first to satisfy FK constraints
    await prisma.busRouteAssignment.deleteMany({ where: { busId } });
    await prisma.busDeviceAssignment.deleteMany({ where: { busId } });
    await prisma.location.deleteMany({ where: { busId } });
    await prisma.activityLog.deleteMany({ where: { busId } });

    // Now delete the bus itself
    await prisma.bus.delete({ where: { id: busId } });

    // Save snapshot into AdminAuditLog
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete bus:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete bus",
      },
      { status: 500 },
    );
  }
}