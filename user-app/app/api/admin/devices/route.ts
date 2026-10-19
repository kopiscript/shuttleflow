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
      const isUnclaimed = device.deviceName
        ?.trim()
        .toUpperCase()
        .startsWith("UNCLAIMED");

      return {
        id: device.id,
        deviceName: device.deviceName,
        isUnclaimed,
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

// POST /api/admin/devices - Claim an existing hardware ID or create a manual record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, deviceName } = body;
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!deviceName || !deviceName.trim()) {
      return NextResponse.json(
        { success: false, error: "Device name is required" },
        { status: 400 },
      );
    }

    const cleanName = deviceName.trim();

    // --- CASE 1: CLAIM EXISTING DETECTED NVS HARDWARE ---
    if (deviceId && deviceId !== "NEW") {
      const parsedId = parseInt(String(deviceId), 10);
      if (isNaN(parsedId)) {
        return NextResponse.json(
          { success: false, error: "Invalid device ID selected" },
          { status: 400 },
        );
      }

      const existingDevice = await prisma.device.findUnique({
        where: { id: parsedId },
      });

      if (!existingDevice) {
        return NextResponse.json(
          { success: false, error: "Device not found" },
          { status: 404 },
        );
      }

      // Update the existing device's name in-place
      const claimedDevice = await prisma.device.update({
        where: { id: parsedId },
        data: {
          deviceName: cleanName,
        },
      });

      await logAdminAudit({
        adminId: session.adminId,
        category: "FLEET",
        action: "DEVICE_CLAIMED",
        targetType: "Device",
        targetId: claimedDevice.id,
        details: {
          previousName: existingDevice.deviceName,
          claimedName: claimedDevice.deviceName,
        },
        req: request,
      });

      return NextResponse.json({
        success: true,
        action: "claimed",
        device: claimedDevice,
      });
    }

    // --- CASE 2: MANUAL PRE-REGISTRATION ---
    const newDevice = await prisma.device.create({
      data: {
        deviceName: cleanName,
        status: "Offline",
        lastSeen: null,
      },
    });

    await logAdminAudit({
      adminId: session.adminId,
      category: "FLEET",
      action: "DEVICE_CREATED",
      targetType: "Device",
      targetId: newDevice.id,
      details: {
        createdRecord: {
          id: newDevice.id,
          deviceName: newDevice.deviceName,
        },
      },
      req: request,
    });

    return NextResponse.json({
      success: true,
      action: "created",
      device: newDevice,
    });
  } catch (error) {
    console.error("Error creating/claiming device:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process device request" },
      { status: 500 },
    );
  }
}