// app/api/admin/buses/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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