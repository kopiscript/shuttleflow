import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routeId = parseInt(id);
    
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    const etaMap: Record<number, string> = {
      1: "45-60 minutes",
      2: "45-60 minutes",
    };

    const eta = etaMap[routeId] || "Calculating...";

    return NextResponse.json({ 
      success: true, 
      eta, 
      routeName: route.routeName 
    });
  } catch (error) {
    console.error("ETA API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate ETA" },
      { status: 500 }
    );
  }
}