// app/api/admin/routes/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test: Check if we can connect to the database
    console.log("Testing database connection...");
    
    // Try to count routes first
    const count = await prisma.route.count();
    console.log(`Found ${count} routes in database`);
    
    // Then fetch all routes
    const routes = await prisma.route.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        routeName: true,
        pickupStop: true,
        dropoffStop: true,
        intermediateStops: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`Returning ${routes.length} routes`);
    
    return NextResponse.json({ 
      success: true, 
      routes,
      count: count 
    });
  } catch (error) {
    console.error("Error in /api/admin/routes:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch routes",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { routeName, pickupStop, dropoffStop, intermediateStops, status } = body;

    console.log("Creating route:", { routeName, pickupStop, dropoffStop });

    if (!routeName || !pickupStop || !dropoffStop) {
      return NextResponse.json(
        { success: false, error: "Route name, pickup stop, and drop-off stop are required" },
        { status: 400 }
      );
    }

    const route = await prisma.route.create({
      data: {
        routeName,
        pickupStop,
        dropoffStop,
        intermediateStops: intermediateStops || [],
        status: status || "Active",
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