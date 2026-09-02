// app/api/admin/devices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/devices/[id] - Fetch a single device
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const deviceId = parseInt(id);

        if (isNaN(deviceId)) {
            return NextResponse.json(
                { success: false, error: "Invalid device ID" },
                { status: 400 }
            );
        }

        const device = await prisma.device.findUnique({
            where: { id: deviceId },
            include: {
                busAssignments: {
                    where: { endedAt: null },
                    include: {
                        bus: {
                            select: {
                                id: true,
                                busName: true,
                                licensePlate: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });

        if (!device) {
            return NextResponse.json(
                { success: false, error: "Device not found" },
                { status: 404 }
            );
        }

        // Format the response
        const activeAssignment = device.busAssignments[0];
        const formattedDevice = {
            id: device.id,
            deviceName: device.deviceName,
            status: device.status,
            lastSeen: device.lastSeen,
            busId: activeAssignment?.busId || null,
            busName: activeAssignment?.bus?.busName || null,
            createdAt: device.createdAt,
            updatedAt: device.updatedAt,
        };

        return NextResponse.json({
            success: true,
            device: formattedDevice,
        });

    } catch (error) {
        console.error("Error fetching device:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch device" },
            { status: 500 }
        );
    }
}

// PUT /api/admin/devices/[id] - Update a device
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const deviceId = parseInt(id);
        const body = await request.json();
        const { deviceName, status, busId } = body;

        if (isNaN(deviceId)) {
            return NextResponse.json(
                { success: false, error: "Invalid device ID" },
                { status: 400 }
            );
        }

        // Update the device
        const device = await prisma.device.update({
            where: { id: deviceId },
            data: {
                deviceName: deviceName,
                status: status,
                lastSeen: status === "Online" ? new Date() : undefined,
            },
        });

        // If busId is provided, assign device to bus
        if (busId !== undefined && busId !== null) {
            // End any existing assignment
            await prisma.busDeviceAssignment.updateMany({
                where: {
                    deviceId: deviceId,
                    endedAt: null,
                },
                data: {
                    endedAt: new Date(),
                },
            });

            // Create new assignment if busId is valid
            if (busId !== null) {
                await prisma.busDeviceAssignment.create({
                    data: {
                        busId: busId,
                        deviceId: deviceId,
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            device: device,
        });

    } catch (error) {
        console.error("Error updating device:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update device" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/devices/[id] - Delete a device
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const deviceId = parseInt(id);

        if (isNaN(deviceId)) {
            return NextResponse.json(
                { success: false, error: "Invalid device ID" },
                { status: 400 }
            );
        }

        // Check if device exists
        const existingDevice = await prisma.device.findUnique({
            where: { id: deviceId },
        });

        if (!existingDevice) {
            return NextResponse.json(
                { success: false, error: "Device not found" },
                { status: 404 }
            );
        }

        // Delete the device (Prisma will cascade delete assignments if set up)
        await prisma.device.delete({
            where: { id: deviceId },
        });

        return NextResponse.json({
            success: true,
            message: "Device deleted successfully",
        });

    } catch (error) {
        console.error("Error deleting device:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete device" },
            { status: 500 }
        );
    }
}