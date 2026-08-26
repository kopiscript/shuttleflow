import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // --- 1. SECURITY CHECK ---
        const authHeader = request.headers.get('authorization');
        const expectedKey = process.env.ESP32_API_KEY;

        // Reject if the API key is missing or incorrect
        if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
            console.warn("Blocked unauthorized GPS data attempt.");
            return NextResponse.json(
                { success: false, error: "Unauthorized API Key" },
                { status: 401 }
            );
        }

        // --- 2. PARSE DATA ---
        const body = await request.json();
        const { busId, latitude, longitude, speed } = body;

        if (!busId || !latitude || !longitude) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // --- 3. SAVE TO DATABASE ---
        const newLocation = await prisma.location.create({
            data: {
                busId: parseInt(busId),
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                speed: speed ? parseFloat(speed) : null
            },
        });

        // --- 4. OPTIMIZATION: KEEP ONLY 7 DAYS OF DATA ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const deletedRows = await prisma.location.deleteMany({
            where: {
                recordedAt: {
                    lt: sevenDaysAgo // Delete anything older than 7 days
                }
            }
        });

        if (deletedRows.count > 0) {
            console.log(`Cleaned up ${deletedRows.count} old location records.`);
        }

        return NextResponse.json({ success: true, data: newLocation }, { status: 201 });

    } catch (error) {
        console.error("GPS API Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to save GPS data" },
            { status: 500 }
        );
    }
}