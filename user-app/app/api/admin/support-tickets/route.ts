// app/api/admin/support-tickets/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const reportType = searchParams.get("reportType");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const where: any = {};
        if (status === "unresolved") {
            where.replies = {
                none: {},
            };
        } else if (status === "resolved") {
            where.replies = {
                some: {},
            };
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
            include: {
                replies: {
                    select: {
                        id: true,
                        sentBy: true,
                        sentAt: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        const transformedTickets = tickets.map((ticket) => ({
            id: ticket.id,
            description: ticket.description,
            email: ticket.email,
            reportType: ticket.reportType,
            status: ticket.replies.length > 0 ? "Resolved" : "Unresolved",
            originalStatus: ticket.status,
            fileUrl: ticket.fileUrl,
            fileUrls: parseFileUrls(ticket.fileUrl),
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            replyCount: ticket.replies.length,
            hasAdminReply: ticket.replies.length > 0,
        }));
        return NextResponse.json({
            success: true,
            tickets: transformedTickets,
            count: transformedTickets.length,
        });
    } catch (error) {
        console.error("Failed to fetch support tickets:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch support tickets",
            },
            {
                status: 500,
            }
        );
    }
}
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