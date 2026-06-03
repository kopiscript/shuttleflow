import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      where: { status: "Active" },
      select: {
        id: true,
        routeName: true,
        pickupStop: true,
        dropoffStop: true,
      },
      orderBy: { routeName: "asc" },
    });

    return NextResponse.json({ success: true, routes });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}