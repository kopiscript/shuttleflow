import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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