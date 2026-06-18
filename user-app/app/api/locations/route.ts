// app/api/locations/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { recordedAt: 'desc' },
      distinct: ['busId'],
      include: {
        bus: {
          include: {
            routeAssignments: {
              where: { endedAt: null },
              include: { route: true }
            }
          }
        }
      }
    });

    const transformed = locations.map((loc) => {
      // Get ALL active route assignments
      const activeAssignments = loc.bus?.routeAssignments || [];
      
      return {
        busId: loc.busId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        speed: loc.speed,
        recordedAt: loc.recordedAt,
        bus: {
          busName: loc.bus?.busName,
          status: loc.bus?.status,
          // Return ALL route IDs so frontend can filter
          routeIds: activeAssignments.map(a => a.routeId),
          routeNames: activeAssignments.map(a => a.route?.routeName),
          routeAssignments: activeAssignments.map(a => ({
            routeId: a.routeId,
            routeName: a.route?.routeName
          }))
        }
      };
    });

    return NextResponse.json({ success: true, locations: transformed });
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}