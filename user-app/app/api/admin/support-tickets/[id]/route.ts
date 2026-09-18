// app/api/admin/support-tickets/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Fetch single ticket
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const ticketId = parseInt(id);

        if (isNaN(ticketId)) {
            return NextResponse.json(
                { success: false, error: "Invalid ticket ID" },
                { status: 400 }
            );
        }

        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
            include: {
                replies: {
                    orderBy: { sentAt: "asc" },
                },
            },
        });

        if (!ticket) {
            return NextResponse.json(
                { success: false, error: "Ticket not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            ticket: {
                ...ticket,
                fileUrls: parseFileUrls(ticket.fileUrl),
            },
        });
    } catch (error) {
        console.error("Failed to fetch ticket:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch ticket" },
            { status: 500 }
        );
    }
}

// PUT - Update ticket status
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
                { success: false, error: "Invalid ticket ID" },
                { status: 400 }
            );
        }

        const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: "Invalid status value" },
                { status: 400 }
            );
        }

        const ticket = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status },
        });

        return NextResponse.json({ success: true, ticket });
    } catch (error) {
        console.error("Failed to update ticket:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update ticket" },
            { status: 500 }
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