// app/api/admin/support-tickets/[id]/reply/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSession } from "@/lib/session";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "ShuttleFlow Support <support@shuttleflow.azmiproductions.com>";
const REPLY_TO_EMAIL = "noreply@shuttleflow.azmiproductions.com";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Auth check
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Not authenticated" },
                { status: 401 }
            );
        }

        // 2. Fetch admin fresh from DB (guarantees correct username)
        const admin = await prisma.admin.findUnique({
            where: { id: session.adminId },
            select: { id: true, username: true },
        });

        if (!admin) {
            return NextResponse.json(
                { success: false, error: "Admin not found" },
                { status: 401 }
            );
        }

        // 3. Parse params + body
        const { id } = await params;
        const ticketId = parseInt(id);
        const body = await request.json();
        const { message } = body;

        if (isNaN(ticketId)) {
            return NextResponse.json(
                { success: false, error: "Invalid ticket ID" },
                { status: 400 }
            );
        }

        if (!message || message.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: "Reply message cannot be empty" },
                { status: 400 }
            );
        }

        // 4. Find ticket
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            return NextResponse.json(
                { success: false, error: "Ticket not found" },
                { status: 404 }
            );
        }

        // 5. Save reply — sentBy is the real admin username from DB
        const reply = await prisma.ticketReply.create({
            data: {
                ticketId: ticket.id,
                message: message.trim(),
                sentBy: admin.username,
            },
        });

        // 6. Send email
        try {
            await resend.emails.send({
                from: FROM_EMAIL,
                to: ticket.email,
                replyTo: REPLY_TO_EMAIL,
                subject: `Re: Support Ticket #T${String(ticket.id).padStart(3, "0")} - ${formatReportType(ticket.reportType)}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #171821;">ShuttleFlow Support</h2>
            <p>Hi,</p>
            <p>Thank you for contacting us. We're following up on your support ticket:</p>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #666;"><strong>Ticket ID:</strong> T${String(ticket.id).padStart(3, "0")}</p>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;"><strong>Report Type:</strong> ${escapeHtml(formatReportType(ticket.reportType))}</p>
            </div>

            <div style="background: #f0f9ff; border-left: 4px solid #96DDFF; padding: 15px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;"><strong>Your message:</strong></p>
              <p style="margin: 0; font-size: 14px; color: #333;">${escapeHtml(ticket.description)}</p>
            </div>

            <div style="background: #e6f7ff; border-left: 4px solid #3EB900; padding: 15px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;"><strong>Our reply:</strong></p>
              <p style="margin: 0; font-size: 14px; color: #333; white-space: pre-wrap;">${escapeHtml(message.trim())}</p>
            </div>

            <p style="margin-top: 30px; color: #666;">
              Best regards,<br/>
              <strong>${escapeHtml(admin.username)}</strong><br/>
              ShuttleFlow Support Team
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">
              This is a post-only mailing. Please do not reply directly to this email.
            </p>
          </div>
        `,
            });
        } catch (emailError) {
            console.error("Failed to send email:", emailError);
            return NextResponse.json({
                success: true,
                reply,
                warning: "Reply saved but email could not be sent",
            });
        }

        return NextResponse.json({ success: true, reply });
    } catch (error) {
        console.error("Failed to send reply:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send reply" },
            { status: 500 }
        );
    }
}

function formatReportType(type: string): string {
    const labels: Record<string, string> = {
        route_problem: "Route Problem",
        feedback: "Feedback",
        bus_delay: "Bus Delay",
        other: "Other",
    };
    return labels[type] || type;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}