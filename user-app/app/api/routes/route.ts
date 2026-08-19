// user-app/app/api/routes/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      where: { status: "Active" },
      orderBy: { id: "asc" },
      select: {
        id: true,
        routeName: true,
        pickupStop: true,
        dropoffStop: true,
      },
    });

    return NextResponse.json({ success: true, routes });
  } catch (error) {
    console.error("Failed to fetch routes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}