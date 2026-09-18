// app/api/admin/routes/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid route ID" },
        { status: 400 }
      );
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        busAssignments: {
          where: { endedAt: null },
          include: {
            bus: {
              include: {
                deviceAssignments: {
                  where: { endedAt: null },
                  include: { device: true },
                },
              },
            },
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    const activeBusAssignment = route.busAssignments.find(
      (assignment) => assignment.bus.status === "Active"
    );

    const derivedStatus = activeBusAssignment ? "Active" : "Inactive";

    // Prisma already returns camelCase — pass it through.
    const transformedRoute = {
      id: route.id,
      routeName: route.routeName,
      pickupStop: route.pickupStop,
      dropoffStop: route.dropoffStop,
      intermediateStops: route.intermediateStops,
      pickupLat: route.pickupLat,
      pickupLng: route.pickupLng,
      dropoffLat: route.dropoffLat,
      dropoffLng: route.dropoffLng,
      status: derivedStatus,
      assignedBuses: route.busAssignments.map((assignment) => ({
        id: assignment.bus.id,
        busName: assignment.bus.busName,
        licensePlate: assignment.bus.licensePlate,
        status: assignment.bus.status,
        device: assignment.bus.deviceAssignments[0]?.device || null,
      })),
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
    };

    return NextResponse.json({ success: true, route: transformedRoute });
  } catch (error) {
    console.error("Failed to fetch route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch route" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routeId = parseInt(id);
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

    if (isNaN(routeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid route ID" },
        { status: 400 }
      );
    }

    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!existingRoute) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    const route = await prisma.route.update({
      where: { id: routeId },
      data: {
        routeName: routeName ?? existingRoute.routeName,
        pickupStop: pickupStop ?? existingRoute.pickupStop,
        dropoffStop: dropoffStop ?? existingRoute.dropoffStop,
        intermediateStops:
          intermediateStops ?? existingRoute.intermediateStops,
        pickupLat:
          pickupLat !== undefined && pickupLat !== null
            ? parseFloat(pickupLat)
            : existingRoute.pickupLat,
        pickupLng:
          pickupLng !== undefined && pickupLng !== null
            ? parseFloat(pickupLng)
            : existingRoute.pickupLng,
        dropoffLat:
          dropoffLat !== undefined && dropoffLat !== null
            ? parseFloat(dropoffLat)
            : existingRoute.dropoffLat,
        dropoffLng:
          dropoffLng !== undefined && dropoffLng !== null
            ? parseFloat(dropoffLng)
            : existingRoute.dropoffLng,
      },
    });

    return NextResponse.json({ success: true, route });
  } catch (error) {
    console.error("Failed to update route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update route" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routeId = parseInt(id);

    if (isNaN(routeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid route ID" },
        { status: 400 }
      );
    }

    const assignments = await prisma.busRouteAssignment.findMany({
      where: {
        routeId,
        endedAt: null,
      },
    });

    if (assignments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete route with ${assignments.length} active bus assignment(s). Please unassign the bus first.`,
        },
        { status: 400 }
      );
    }

    await prisma.route.delete({
      where: { id: routeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete route" },
      { status: 500 }
    );
  }
}