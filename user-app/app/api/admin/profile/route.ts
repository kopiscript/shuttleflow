import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { logAdminAudit } from "@/lib/adminAuditLog";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        username: true,
        email: true,
        pendingEmail: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, email } = body;

    if (!username || !email) {
      return NextResponse.json(
        { success: false, error: "Username and email are required" },
        { status: 400 }
      );
    }

    // Check if username is already taken by another admin
    const duplicateUsername = await prisma.admin.findFirst({
      where: {
        username,
        NOT: { id: session.adminId },
      },
    });

    if (duplicateUsername) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }

    // Get old username for audit comparison
    const oldAdmin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: { username: true },
    });

    // Note: email is NOT updated here (goes through verification flow)
    const admin = await prisma.admin.update({
      where: { id: session.adminId },
      data: { username },
      select: {
        id: true,
        username: true,
        email: true,
        pendingEmail: true,
        createdAt: true,
      },
    });

    // Audit log if username changed
    if (oldAdmin && oldAdmin.username !== username) {
      await logAdminAudit({
        adminId: session.adminId,
        category: "SETTINGS",
        action: "USERNAME_CHANGED",
        targetType: "Admin",
        targetId: session.adminId,
        details: {
          oldUsername: oldAdmin.username,
          newUsername: username,
        },
        req: request,
      });
    }

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}