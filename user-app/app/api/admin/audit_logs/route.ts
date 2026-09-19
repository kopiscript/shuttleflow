import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        // Ultra-safe fallback: Check all possible Prisma casing names
        const auditClient =
            (prisma as any).adminAuditLog ??
            (prisma as any).admin_audit_logs ??
            (prisma as any).adminAuditLogs;

        if (!auditClient) {
            throw new Error("Audit client still undefined after fixing import.");
        }

        const logs = await auditClient.findMany({
            include: {
                admin: { select: { username: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch audit logs" }, { status: 500 });
    }
}