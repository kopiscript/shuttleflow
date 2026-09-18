// app/api/admin/support-tickets/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Fetch all support tickets with optional filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const reportType = searchParams.get("reportType");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: any = {};

        if (status && status !== "all") {
            where.status = status;
        }

        if (reportType && reportType !== "all") {
            where.reportType = reportType;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const tickets = await prisma.supportTicket.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        // Transform fileUrl into a proper array
        const transformedTickets = tickets.map((ticket) => ({
            ...ticket,
            fileUrls: parseFileUrls(ticket.fileUrl),
        }));

        return NextResponse.json({
            success: true,
            tickets: transformedTickets,
        });
    } catch (error) {
        console.error("Failed to fetch support tickets:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch support tickets" },
            { status: 500 }
        );
    }
}

// Helper to handle both string and JSON array formats
function parseFileUrls(fileUrl: string | null): string[] {
    if (!fileUrl) return [];
    try {
        if (fileUrl.startsWith("[")) {
            const parsed = JSON.parse(fileUrl);
            return Array.isArray(parsed) ? parsed : [];
        }
        return [fileUrl];
    } catch {
        return [];
    }
}