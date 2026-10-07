import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { logAdminAudit } from "@/lib/adminAuditLog";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findFirst({
      where: {
        emailChangeToken: token,
        emailChangeExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification link" },
        { status: 400 }
      );
    }

    if (!admin.pendingEmail) {
      return NextResponse.json(
        { success: false, error: "No pending email change found" },
        { status: 400 }
      );
    }

    const existing = await prisma.admin.findFirst({
      where: {
        email: admin.pendingEmail,
        NOT: { id: admin.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "This email is now in use by another admin. Please request a new change.",
        },
        { status: 409 }
      );
    }

    const oldEmail = admin.email;
    const newEmail = admin.pendingEmail;

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        email: newEmail,
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeExpiry: null,
      },
    });

    // Audit log: email change confirmed
    await logAdminAudit({
      adminId: admin.id,
      category: "SETTINGS",
      action: "EMAIL_CHANGED",
      targetType: "Admin",
      targetId: admin.id,
      details: {
        oldEmail,
        newEmail,
      },
      req: request,
    });

    // Send security alert to the OLD email
    try {
      await resend.emails.send({
        from: "ShuttleFlow <noreply@shuttleflow.azmiproductions.com>",
        to: oldEmail,
        subject: "Security Alert: Your Email Was Changed",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #21222D; padding: 30px; border-radius: 12px;">
              <h1 style="color: #FFC0B9; margin: 0 0 20px 0; font-size: 24px;">Your Email Was Changed</h1>
              <p style="color: #D2D2D2; font-size: 14px; line-height: 1.6;">
                Hi ${admin.username},
              </p>
              <p style="color: #D2D2D2; font-size: 14px; line-height: 1.6;">
                Your ShuttleFlow Admin account email was successfully changed from:
              </p>
              <div style="background-color: #171821; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
                <p style="color: #FFC0B9; font-size: 13px; margin: 0; word-break: break-all;">
                  <strong>Old:</strong> ${oldEmail}
                </p>
                <p style="color: #3EB900; font-size: 13px; margin: 8px 0 0 0; word-break: break-all;">
                  <strong>New:</strong> ${newEmail}
                </p>
              </div>
              <p style="color: #D2D2D2; font-size: 14px; line-height: 1.6;">
                If you made this change, no further action is needed.
              </p>
              <p style="color: #EA1701; font-size: 14px; line-height: 1.6; font-weight: bold;">
                If you did NOT make this change, please contact your system administrator immediately.
              </p>
              <hr style="border: none; border-top: 1px solid #2C2D33; margin: 30px 0;" />
              <p style="color: #87888C; font-size: 11px; text-align: center; margin: 0;">
                © 2026 ShuttleFlow. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send security alert email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Email changed successfully.",
      newEmail,
    });
  } catch (error) {
    console.error("Confirm email change error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to confirm email change" },
      { status: 500 }
    );
  }
}