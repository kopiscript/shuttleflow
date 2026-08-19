// user-app/app/api/admin/devices/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ success: true, devices });
  } catch (error) {
    console.error("Failed to fetch devices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}