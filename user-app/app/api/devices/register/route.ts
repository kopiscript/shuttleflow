// user-app/app/api/devices/register/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // 1. Validate ESP32 API Key
        const authHeader = request.headers.get("authorization");
        const expectedKey = process.env.ESP32_API_KEY;

        if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
            return NextResponse.json(
                { success: false, error: "Unauthorized API Key" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const macAddress = body.macAddress?.trim();

        if (!macAddress) {
            return NextResponse.json(
                { success: false, error: "macAddress is required" },
                { status: 400 }
            );
        }

        const unclaimedName = `UNCLAIMED (${macAddress})`;

        // 2. Check if this ESP32 MAC already registered previously
        const existingDevice = await prisma.device.findFirst({
            where: {
                deviceName: {
                    contains: macAddress,
                },
            },
        });

        if (existingDevice) {
            await prisma.device.update({
                where: { id: existingDevice.id },
                data: { lastSeen: new Date(), status: "Online" },
            });

            return NextResponse.json({
                success: true,
                deviceId: existingDevice.id,
                formattedId: `D${String(existingDevice.id).padStart(3, "0")}`,
                isNew: false,
            });
        }

        // 3. Create a brand new Device ID in the database
        const newDevice = await prisma.device.create({
            data: {
                deviceName: unclaimedName,
                status: "Online",
                lastSeen: new Date(),
            },
        });

        return NextResponse.json(
            {
                success: true,
                deviceId: newDevice.id,
                formattedId: `D${String(newDevice.id).padStart(3, "0")}`,
                isNew: true,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("ESP32 Device Registration Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to provision device ID" },
            { status: 500 }
        );
    }
}