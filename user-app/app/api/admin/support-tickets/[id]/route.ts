// app/api/admin/support-tickets/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const ticketId = parseInt(id);
        if (isNaN(ticketId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid ticket ID",
                },
                {
                    status: 400,
                }
            );
        }
        const ticket = await prisma.supportTicket.findUnique({
            where: {
                id: ticketId,
            },
            include: {
                replies: {
                    orderBy: {
                        sentAt: "asc",
                    },
                },
            },
        });
        if (!ticket) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Ticket not found",
                },
                {
                    status: 404,
                }
            );
        }
        const resolved = ticket.replies.length > 0;

        const fileKeys = parseFileUrls(ticket.fileUrl);

        const attachments = fileKeys.map((key) => ({
            key,

            fileName:
                key.split("/").pop() ||
                "Attachment",

            url:
                `/api/admin/support-tickets/attachment?key=${encodeURIComponent(key)}`,
        }));

        return NextResponse.json({
            success: true,

            ticket: {
                id: ticket.id,
                description: ticket.description,
                email: ticket.email,
                reportType: ticket.reportType,

                status: resolved
                    ? "Resolved"
                    : "Unresolved",

                originalStatus: ticket.status,

                fileUrl: ticket.fileUrl,

                fileUrls: attachments,

                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,

                replies: ticket.replies,

                replyCount: ticket.replies.length,

                hasAdminReply: resolved,
            },
        });
    } catch (error) {
        console.error("Failed to fetch ticket:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch ticket",
            },
            {
                status: 500,
            }
        );
    }
}
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const ticketId = parseInt(id);
        const body = await request.json();
        const { status } = body;
        if (isNaN(ticketId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid ticket ID",
                },
                {
                    status: 400,
                }
            );
        }
        if (status !== "Resolved") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Tickets are resolved automatically after an admin reply",
                },
                {
                    status: 400,
                }
            );
        }
        const ticket = await prisma.supportTicket.findUnique({
            where: {
                id: ticketId,
            },
            include: {
                replies: true,
            },
        });
        if (!ticket) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Ticket not found",
                },
                {
                    status: 404,
                }
            );
        }
        if (ticket.replies.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "A ticket cannot be resolved before an admin reply is sent",
                },
                {
                    status: 400,
                }
            );
        }
        const updatedTicket = await prisma.supportTicket.update({
            where: {
                id: ticketId,
            },
            data: {
                status: "Resolved",
            },
        });
        return NextResponse.json({
            success: true,
            ticket: {
                ...updatedTicket,
                status: "Resolved",
            },
        });
    } catch (error) {
        console.error("Failed to update ticket:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to update ticket",
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
            return Array.isArray(parsed)
                ? parsed
                : [];
        }
        return [fileUrl];
    } catch {
        return [];
    }
}