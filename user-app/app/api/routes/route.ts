// app/api/routes/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      where: {
        // Only return routes that have an active bus assignment
        busAssignments: {
          some: {
            endedAt: null,
            bus: {
              status: "Active",
            },
          },
        },
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        routeName: true,
        pickupStop: true,
        dropoffStop: true,
        pickupLat: true,
        pickupLng: true,
        dropoffLat: true,
        dropoffLng: true,
      },
    });

    return NextResponse.json({ success: true, routes });
  } catch (error) {
    console.error("Failed to fetch routes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}