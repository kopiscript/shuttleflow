import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routeId = parseInt(id);
    
    console.log(`📡 Fetching route details for ID: ${routeId}`);
    
    if (isNaN(routeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid route ID" },
        { status: 400 }
      );
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Route found: ${route.routeName}`);

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        routeName: route.routeName,
        pickupStop: route.pickupStop,
        dropoffStop: route.dropoffStop,
        pickupLat: route.pickupLat,
        pickupLng: route.pickupLng,
        dropoffLat: route.dropoffLat,
        dropoffLng: route.dropoffLng,
      }
    });
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch route" },
      { status: 500 }
    );
  }
}