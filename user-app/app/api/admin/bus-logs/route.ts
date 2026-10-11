import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const busId = searchParams.get("busId");
        const isExport = searchParams.get("export") === "true";

        // Fix 1: Use camelCase 'busId'
        const where = busId && busId !== "ALL" ? { busId: parseInt(busId) } : {};

        const logs = await prisma.location.findMany({
            where,
            include: {
                bus: {
                    // Fix 2: Use camelCase 'busName' and 'licensePlate'
                    select: { busName: true, licensePlate: true }
                }
            },
            // Fix 3: Use camelCase 'recordedAt'
            orderBy: { recordedAt: "desc" },
            take: isExport ? 5000 : 500, // Export grabs a larger chunk
        });

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error("Failed to fetch bus logs:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch bus location logs" },
            { status: 500 }
        );
    }
}