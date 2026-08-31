// app/api/admin/routes/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// app/api/admin/routes/[id]/route.ts - Update the GET method
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
      select: {
        id: true,
        routeName: true,
        pickupStop: true,
        dropoffStop: true,
        intermediateStops: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        busAssignments: {
          where: {
            endedAt: null,
          },
          include: {
            bus: {
              include: {
                deviceAssignments: {
                  where: {
                    endedAt: null,
                  },
                  include: {
                    device: true,
                  },
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

    const transformedRoute = {
      id: route.id,
      routeName: route.routeName,
      pickupStop: route.pickupStop,
      dropoffStop: route.dropoffStop,
      intermediateStops: route.intermediateStops,
      status: route.status,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      assignedBuses: route.busAssignments.map((assignment) => ({
        id: assignment.bus.id,
        busName: assignment.bus.busName,
        licensePlate: assignment.bus.licensePlate,
        device: assignment.bus.deviceAssignments[0]?.device || null,
      })),
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
    const { routeName, pickupStop, dropoffStop, intermediateStops, status } = body;

    console.log(`Updating route ${routeId}:`, { routeName, pickupStop, dropoffStop });

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
        routeName: routeName || existingRoute.routeName,
        pickupStop: pickupStop || existingRoute.pickupStop,
        dropoffStop: dropoffStop || existingRoute.dropoffStop,
        intermediateStops: intermediateStops || existingRoute.intermediateStops,
        status: status || existingRoute.status,
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

    console.log(`Deleting route ${routeId}`);

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
          error: `Cannot delete route with ${assignments.length} active bus assignment(s).` 
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