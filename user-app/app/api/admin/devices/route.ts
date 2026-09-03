// app/api/admin/devices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/devices - Fetch all devices
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
      return {
        id: device.id,
        deviceName: device.deviceName,
        status: device.status,
        lastSeen: device.lastSeen,
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
      { status: 500 }
    );
  }
}

// POST /api/admin/devices - Add a new device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceName, busId, status } = body;

    if (!deviceName) {
      return NextResponse.json(
        { success: false, error: "Device name is required" },
        { status: 400 }
      );
    }

    // Create the device
    const device = await prisma.device.create({
      data: {
        deviceName: deviceName,
        status: status || "Offline",
        lastSeen: status === "Online" ? new Date() : null,
      },
    });

    // If busId is provided, assign device to bus
    if (busId) {
      await prisma.busDeviceAssignment.create({
        data: {
          busId: busId,
          deviceId: device.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      device: device,
    });
  } catch (error) {
    console.error("Error creating device:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create device" },
      { status: 500 }
    );
  }
}