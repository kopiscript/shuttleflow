// app/api/admin/devices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeviceHealth } from "@/lib/deviceHealth";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/devices/[id] - Fetch a single device
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deviceId = parseInt(id);

    if (isNaN(deviceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid device ID" },
        { status: 400 },
      );
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        busAssignments: {
          where: { endedAt: null },
          include: {
            bus: {
              select: {
                id: true,
                busName: true,
                licensePlate: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!device) {
      return NextResponse.json(
        { success: false, error: "Device not found" },
        { status: 404 },
      );
    }

    // Format the response
    const activeAssignment = device.busAssignments[0];
    const health = getDeviceHealth(device.lastSeen);
    const formattedDevice = {
      id: device.id,
      deviceName: device.deviceName,
      status: health.status,
      lastSeen: device.lastSeen,
      minutesSinceLastPing: health.minutesSinceLastPing,
      busId: activeAssignment?.busId || null,
      busName: activeAssignment?.bus?.busName || null,
      busLicensePlate: activeAssignment?.bus?.licensePlate || null,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };

    return NextResponse.json({
      success: true,
      device: formattedDevice,
    });
  } catch (error) {
    console.error("Error fetching device:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch device" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/devices/[id] - Update a device
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deviceId = parseInt(id);
    const body = await request.json();
    const { deviceName } = body;
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (isNaN(deviceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid device ID" },
        { status: 400 },
      );
    }

    const oldDevice = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!oldDevice) {
      return NextResponse.json(
        { success: false, error: "Device not found" },
        { status: 404 },
      );
    }

    // Update the device
    const device = await prisma.device.update({
      where: { id: deviceId },
      data: {
        deviceName: deviceName,
      },
    });

    // Record the edit
    await logAdminAudit({
      adminId: session.adminId,
      category: "FLEET",
      action: "DEVICE_UPDATED",
      targetType: "Device",
      targetId: deviceId,
      details: {
        before: {
          id: oldDevice.id,
          deviceName: oldDevice.deviceName,
        },
        after: {
          id: device.id,
          deviceName: device.deviceName,
        },
      },
      req: request,
    });

    return NextResponse.json({
      success: true,
      device: device,
    });
  } catch (error) {
    console.error("Error updating device:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update device" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/devices/[id] - Delete a device
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deviceId = parseInt(id);
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (isNaN(deviceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid device ID" },
        { status: 400 },
      );
    }

    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!existingDevice) {
      return NextResponse.json(
        { success: false, error: "Device not found" },
        { status: 404 },
      );
    }

    // Delete the device (Prisma will cascade delete assignments if set up)
    await prisma.device.delete({
      where: { id: deviceId },
    });

    await logAdminAudit({
      adminId: session.adminId,
      category: "FLEET",
      action: "DEVICE_DELETED",
      targetType: "Device",
      targetId: deviceId,
      details: {
        deletedRecord: {
          id: existingDevice.id,
          deviceName: existingDevice.deviceName,
          lastSeen: existingDevice.lastSeen?.toISOString() ?? null,
        },
      },
      req: request,
    });

    return NextResponse.json({
      success: true,
      message: "Device deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting device:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete device" },
      { status: 500 },
    );
  }
}
