// app/api/admin/devices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeviceHealth } from "@/lib/deviceHealth";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";

export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      include: {
        busAssignments: {
          where: { endedAt: null },
          include: {
            bus: {
              select: {
                id: true,
                busName: true,
                licensePlate: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedDevices = devices.map((device) => {
      const activeAssignment = device.busAssignments[0];
      const health = getDeviceHealth(device.lastSeen);
      return {
        id: device.id,
        deviceName: device.deviceName,
        status: health.status,
        lastSeen: device.lastSeen,
        minutesSinceLastPing: health.minutesSinceLastPing,
        busId: activeAssignment?.busId || null,
        busName: activeAssignment?.bus?.busName || null,
        busLicensePlate: activeAssignment?.bus?.licensePlate || null,
        createdAt: device.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch devices" },
      { status: 500 },
    );
  }
}

// POST /api/admin/devices - Add a new device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceName } = body;
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!deviceName) {
      return NextResponse.json(
        { success: false, error: "Device name is required" },
        { status: 400 },
      );
    }

    // Create the device
    const device = await prisma.device.create({
      data: {
        deviceName,
        status: "Offline",
        lastSeen: null,
      },
    });

    // ADD THE AUDIT LOG HERE
    await logAdminAudit({
      adminId: session.adminId,
      category: "FLEET",
      action: "DEVICE_CREATED",
      targetType: "Device",
      targetId: device.id,
      details: {
        createdRecord: {
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
    console.error("Error creating device:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create device" },
      { status: 500 },
    );
  }
}
