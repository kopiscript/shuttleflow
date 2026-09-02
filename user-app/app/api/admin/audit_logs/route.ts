// app/api/admin/audit_logs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            take: 100, // Limit to last 100 logs
        });

        return NextResponse.json({
            success: true,
            logs: logs,
        });
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}