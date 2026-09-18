// app/api/admin/routes/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { id: "asc" },
      include: {
        busAssignments: {
          where: { endedAt: null },
          include: {
            bus: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const transformedRoutes = routes.map((route) => {
      // Route is active only if there's an active bus assigned
      const activeBusAssignment = route.busAssignments.find(
        (assignment) => assignment.bus.status === "Active"
      );

      const derivedStatus = activeBusAssignment ? "Active" : "Inactive";

      return {
        id: route.id,
        routeName: route.routeName,
        pickupStop: route.pickupStop,
        dropoffStop: route.dropoffStop,
        intermediateStops: route.intermediateStops,
        pickupLat: route.pickupLat,
        pickupLng: route.pickupLng,
        dropoffLat: route.dropoffLat,
        dropoffLng: route.dropoffLng,
        status: derivedStatus, // Derived, not from DB
        assignedBus: activeBusAssignment?.bus || null,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      routes: transformedRoutes,
    });
  } catch (error) {
    console.error("Error in /api/admin/routes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch routes",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      routeName,
      pickupStop,
      dropoffStop,
      intermediateStops,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    } = body;

    if (!routeName || !pickupStop || !dropoffStop) {
      return NextResponse.json(
        {
          success: false,
          error: "Route name, pickup stop, and drop-off stop are required",
        },
        { status: 400 }
      );
    }

    const route = await prisma.route.create({
      data: {
        routeName,
        pickupStop,
        dropoffStop,
        intermediateStops: intermediateStops || [],
        pickupLat: pickupLat ? parseFloat(pickupLat) : null,
        pickupLng: pickupLng ? parseFloat(pickupLng) : null,
        dropoffLat: dropoffLat ? parseFloat(dropoffLat) : null,
        dropoffLng: dropoffLng ? parseFloat(dropoffLng) : null,
        // No status field - it will be derived
      },
    });

    return NextResponse.json({ success: true, route });
  } catch (error) {
    console.error("Failed to create route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create route" },
      { status: 500 }
    );
  }
}