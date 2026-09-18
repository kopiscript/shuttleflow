// app/api/admin/routes/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { deriveRouteStatus, routeStatusInclude } from "@/lib/routeStatus";

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { id: "asc" },
      include: routeStatusInclude,
    });

    const transformedRoutes = routes.map((route) => {
      const derivedStatus = deriveRouteStatus(route.busAssignments);

      // This assignment is used for the route dropdown.
      // A route is considered assigned here whenever the BusRouteAssignment
      // is still open (endedAt === null), regardless of bus/device status.
      // This is intentionally different from derived route Active status.
      const currentRouteAssignment = route.busAssignments.find(
        (a) => a.endedAt === null
      );

      // Find the assignment that actually satisfies the Active rule:
      // open assignment + active bus + bus has a currently assigned device.
      const activeBusAssignment = route.busAssignments.find((a) => {
        if (a.endedAt !== null) return false;
        if (a.bus.status.trim().toLowerCase() !== "active") return false;
        const deviceAssignments = a.bus.deviceAssignments ?? [];
        return deviceAssignments.some((d) => d.endedAt === null);
      });

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
        // Used by Bus Add/Edit to disable routes already assigned to another bus.
        assignedBusId: currentRouteAssignment?.bus.id ?? null,
        assignedBusName: currentRouteAssignment?.bus.busName ?? null,

        assignedBus: activeBusAssignment?.bus
          ? {
              id: activeBusAssignment.bus.id,
              busName: activeBusAssignment.bus.busName,
              licensePlate: activeBusAssignment.bus.licensePlate,
              status: activeBusAssignment.bus.status,
            }
          : null,
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
        error:
          error instanceof Error ? error.message : "Failed to fetch routes",
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
        pickupLat:
          pickupLat !== undefined && pickupLat !== null
            ? parseFloat(pickupLat)
            : null,
        pickupLng:
          pickupLng !== undefined && pickupLng !== null
            ? parseFloat(pickupLng)
            : null,
        dropoffLat:
          dropoffLat !== undefined && dropoffLat !== null
            ? parseFloat(dropoffLat)
            : null,
        dropoffLng:
          dropoffLng !== undefined && dropoffLng !== null
            ? parseFloat(dropoffLng)
            : null,
      },
      include: routeStatusInclude,
    });

    return NextResponse.json({
      success: true,
      route: {
        ...route,
        status: deriveRouteStatus(route.busAssignments),
      },
    });
  } catch (error) {
    console.error("Failed to create route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create route" },
      { status: 500 }
    );
  }
}