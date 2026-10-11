import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newEmail } = body;

    if (!newEmail || typeof newEmail !== "string") {
      return NextResponse.json(
        { success: false, error: "New email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const trimmedEmail = newEmail.trim().toLowerCase();

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    if (admin.email.toLowerCase() === trimmedEmail) {
      return NextResponse.json(
        { success: false, error: "New email is the same as your current email" },
        { status: 400 }
      );
    }

    const existing = await prisma.admin.findFirst({
      where: {
        email: trimmedEmail,
        NOT: { id: admin.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This email is already in use by another admin" },
        { status: 409 }
      );
    }

    // Generate verification token
    const emailChangeToken = crypto.randomBytes(32).toString("hex");
    const emailChangeExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        pendingEmail: trimmedEmail,
        emailChangeToken,
        emailChangeExpiry,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const confirmUrl = `${baseUrl}/admin/confirm-email?token=${emailChangeToken}`;

    try {
      const { error: emailError } = await resend.emails.send({
        from: "ShuttleFlow <noreply@shuttleflow.azmiproductions.com>",
        to: trimmedEmail,
        subject: "Confirm Your New Email - ShuttleFlow Admin",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #21222D; padding: 30px; border-radius: 12px;">
              <h1 style="color: #96DDFF; margin: 0 0 20px 0; font-size: 24px;">Confirm Your New Email</h1>
              <p style="color: #D2D2D2; font-size: 14px; line-height: 1.6;">
                Hi ${admin.username},
              </p>
              <p style="color: #D2D2D2; font-size: 14px; line-height: 1.6;">
                You requested to change your ShuttleFlow Admin email to this address. Click the button below to confirm.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmUrl}" style="display: inline-block; background-color: #96DDFF; color: #171821; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                  Confirm Email Change
                </a>
              </div>
              <p style="color: #87888C; font-size: 12px; line-height: 1.6;">
                This link will expire in <strong>1 hour</strong>. If you didn't request this change, you can safely ignore this email. Your current email will remain unchanged.
              </p>
              <p style="color: #87888C; font-size: 12px; line-height: 1.6; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #96DDFF; font-size: 11px; word-break: break-all;">
                ${confirmUrl}
              </p>
              <hr style="border: none; border-top: 1px solid #2C2D33; margin: 30px 0;" />
              <p style="color: #87888C; font-size: 11px; text-align: center; margin: 0;">
                © 2026 ShuttleFlow. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      if (emailError) {
        console.error("Resend API error:", emailError);
        await prisma.admin.update({
          where: { id: admin.id },
          data: {
            pendingEmail: null,
            emailChangeToken: null,
            emailChangeExpiry: null,
          },
        });
        return NextResponse.json(
          { success: false, error: `Failed to send verification email: ${emailError.message}` },
          { status: 500 }
        );
      }

      // Audit log: email change requested
      await logAdminAudit({
        adminId: admin.id,
        category: "SETTINGS",
        action: "EMAIL_CHANGE_REQUESTED",
        targetType: "Admin",
        targetId: admin.id,
        details: {
          oldEmail: admin.email,
          pendingEmail: trimmedEmail,
        },
        req: request,
      });

      return NextResponse.json({
        success: true,
        message: `Verification email sent to ${trimmedEmail}. Please check your inbox.`,
      });
    } catch (error) {
      console.error("Email send error:", error);
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeExpiry: null,
        },
      });
      return NextResponse.json(
        { success: false, error: "Failed to send verification email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request email change error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}