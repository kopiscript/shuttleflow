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
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      await logAdminAudit({
        category: "AUTH",
        action: "LOGIN_FAILED",
        details: { attemptedUsername: username, reason: "User not found" },
        req: request,
      });

      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      await logAdminAudit({
        adminId: admin.id,
        category: "AUTH",
        action: "LOGIN_FAILED",
        details: { attemptedUsername: username, reason: "Incorrect password" },
        req: request,
      });

      return NextResponse.json(
        { success: false, error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Safely read role even if IDE type cache is still refreshing
    const role = (admin as any).role || "ADMIN";

    // Pass role and rememberMe into session creation
    await createSession(
      {
        adminId: admin.id,
        username: admin.username,
        email: admin.email,
      },
      rememberMe === true
    );

    await logAdminAudit({
      adminId: admin.id,
      category: "AUTH",
      action: "LOGIN_SUCCESS",
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