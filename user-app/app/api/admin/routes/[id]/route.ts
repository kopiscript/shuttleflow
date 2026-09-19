// user-app/app/api/admin/routes/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { deriveRouteStatus, routeStatusInclude } from "@/lib/routeStatus";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";

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
      // Use the shared include so device assignments are fetched too —
      // the old custom include here only selected bus fields and never
      // fetched deviceAssignments, so this endpoint could never see
      // whether a device was actually attached.
      include: routeStatusInclude,
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    const derivedStatus = deriveRouteStatus(route.busAssignments);

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
      assignedBuses: route.busAssignments
        .filter((a) => a.endedAt === null)
        .map((assignment) => {
          const hasDevice = (assignment.bus.deviceAssignments ?? []).some(
            (d) => d.endedAt === null
          );
          return {
            id: assignment.bus.id,
            busName: assignment.bus.busName,
            licensePlate: assignment.bus.licensePlate,
            status: assignment.bus.status,
            hasDevice, // lets the admin UI show *why* a route isn't active
          };
        }),
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
        // NOTE: `status` is deliberately NOT written here — it's derived on read.
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

    const session = await getSession();

    const routeToDelete = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (routeToDelete) {
      await logAdminAudit({
        adminId: session?.adminId ?? null,
        category: "FLEET",
        action: "ROUTE_DELETED",
        targetType: "Route",
        targetId: routeId,
        details: { deletedRecord: routeToDelete },
        req: request,
      });
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