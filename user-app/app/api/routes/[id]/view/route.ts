import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
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

    // Verify route exists
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: { id: true },
    });

    if (!route) {
      return NextResponse.json(
        { success: false, error: "Route not found" },
        { status: 404 }
      );
    }

    // Log the view
    await prisma.routeView.create({
      data: {
        routeId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to log route view:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log view" },
      { status: 500 }
    );
  }
}