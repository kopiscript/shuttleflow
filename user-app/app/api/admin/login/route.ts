import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, rememberMe } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username/email and password are required" },
        { status: 400 }
      );
    }

    // Accept either username OR email
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!admin) {
      // Log failed login attempt (unknown user)
      await logAdminAudit({
        adminId: null,
        category: "AUTH",
        action: "LOGIN_FAILED",
        targetType: "Admin",
        targetId: username,
        details: { reason: "User not found" },
        req: request,
      });

      return NextResponse.json(
        { success: false, error: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      // Log failed login attempt (wrong password)
      await logAdminAudit({
        adminId: admin.id,
        category: "AUTH",
        action: "LOGIN_FAILED",
        targetType: "Admin",
        targetId: admin.id,
        details: { reason: "Invalid password" },
        req: request,
      });

      return NextResponse.json(
        { success: false, error: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    await createSession(
      {
        adminId: admin.id,
        username: admin.username,
        email: admin.email,
      },
      rememberMe === true
    );

    // Log successful login
    await logAdminAudit({
      adminId: admin.id,
      category: "AUTH",
      action: "LOGIN_SUCCESS",
      targetType: "Admin",
      targetId: admin.id,
      details: { username: admin.username },
      req: request,
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to login" },
      { status: 500 }
    );
  }
}