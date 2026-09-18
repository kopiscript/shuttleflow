import { prisma } from "@/lib/prisma";

export interface LogAdminAuditParams {
    adminId?: number | null;
    category: "AUTH" | "FLEET" | "SETTINGS";
    action: string;
    targetType?: string | null;
    targetId?: string | number | null;
    details?: Record<string, any> | null;
    req?: Request;
}

export async function logAdminAudit({
    adminId,
    category,
    action,
    targetType,
    targetId,
    details,
    req,
}: LogAdminAuditParams) {
    try {
        let ipAddress = "unknown";
        if (req) {
            const forwarded = req.headers.get("x-forwarded-for");
            ipAddress = forwarded
                ? forwarded.split(",")[0].trim()
                : req.headers.get("x-real-ip") || "unknown";
        }

        // Ultra-safe fallback: Check all possible Prisma casing names
        const auditClient =
            (prisma as any).adminAuditLog ??
            (prisma as any).admin_audit_logs ??
            (prisma as any).adminAuditLogs;

        if (auditClient) {
            await auditClient.create({
                data: {
                    adminId: adminId ?? null,
                    category,
                    action,
                    targetType: targetType ? String(targetType) : null,
                    targetId: targetId !== undefined && targetId !== null ? String(targetId) : null,
                    details: details ?? undefined,
                    ipAddress,
                },
            });
        } else {
            console.error("Audit client is undefined; cannot write audit log.");
        }
    } catch (error) {
        // Non-blocking: failures to log must never interrupt client requests
        console.error("Failed to write admin audit log:", error);
    }
}