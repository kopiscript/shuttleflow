import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // --- 1. SECURITY CHECK ---
        const authHeader = request.headers.get('authorization');
        const expectedKey = process.env.GPS_API_KEY;

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

        // --- 4. OPTIMIZATION: KEEP ONLY 50 NEWEST ROWS ---
        const rowsToKeep = await prisma.location.findMany({
            orderBy: { recordedAt: 'desc' },
            take: 50,
            select: { id: true }
        });

        const keepIds = rowsToKeep.map(row => row.id);

        if (keepIds.length > 0) {
            await prisma.location.deleteMany({
                where: {
                    id: { notIn: keepIds }
                }
            });
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