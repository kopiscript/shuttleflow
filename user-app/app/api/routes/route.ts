// app/api/routes/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { deriveRouteStatus, routeStatusInclude } from "@/lib/routeStatus";

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { id: "asc" },
      include: routeStatusInclude,
    });

    // Only return routes that have an active bus AND an assigned device.
    const activeRoutes = routes
      .filter((r) => deriveRouteStatus(r.busAssignments) === "Active")
      .map((route) => ({
        id: route.id,
        routeName: route.routeName,
        pickupStop: route.pickupStop,
        dropoffStop: route.dropoffStop,
        pickupLat: route.pickupLat,
        pickupLng: route.pickupLng,
        dropoffLat: route.dropoffLat,
        dropoffLng: route.dropoffLng,
        intermediateStops: route.intermediateStops,
      }));

    return NextResponse.json({ success: true, routes: activeRoutes });
  } catch (error) {
    console.error("Failed to fetch public routes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}