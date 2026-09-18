import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    // Always return success (don't reveal if email exists)
    if (!admin) {
      return NextResponse.json({
        success: true,
        message: "If the email exists, a reset link has been sent.",
      });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/admin/reset-password?token=${resetToken}`;

    // Send email via Resend
    try {
      const { error: emailError } = await resend.emails.send({
        from: "ShuttleFlow <noreply@shuttleflow.azmiproductions.com>",
        to: admin.email,
        subject: "Reset Your ShuttleFlow Admin Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #21222D; padding: 30px; border-radius: 12px;">
              <h1 style="color: #96DDFF; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h1>
              <p style="color: #D2D2D2; font-size: 14px; line-height: 1.6;">
                Hi ${admin.username},
              </p>
              <p style="color: #D2D2D2; font-size: 14px; line-height: 1.6;">
                We received a request to reset your ShuttleFlow Admin password. Click the button below to create a new password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #96DDFF; color: #171821; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                  Reset Password
                </a>
              </div>
              <p style="color: #87888C; font-size: 12px; line-height: 1.6;">
                This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
              </p>
              <p style="color: #87888C; font-size: 12px; line-height: 1.6; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #96DDFF; font-size: 11px; word-break: break-all;">
                ${resetUrl}
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
        return NextResponse.json(
          {
            success: false,
            error: `Failed to send email: ${emailError.message}`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Reset link sent to your email. Please check your inbox.",
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send reset email. Please try again later.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}