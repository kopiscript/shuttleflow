// user-app/app/api/gps/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { sendAlertNotification, sendDelayNotification } from "@/lib/notifications";

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
        const { busId, latitude, longitude, speed, alert } = body;

        if (!busId || latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const parsedBusId = parseInt(busId);
        if (isNaN(parsedBusId)) {
            return NextResponse.json(
                { success: false, error: "Invalid bus ID" },
                { status: 400 }
            );
        }

        // --- 3. FETCH BUS & ACTIVE ROUTE DETAILS ---
        const bus = await prisma.bus.findUnique({
            where: { id: parsedBusId },
            include: {
                routeAssignments: {
                    where: { endedAt: null },
                    include: { route: true }
                }
            }
        });

        if (!bus) {
            return NextResponse.json(
                { success: false, error: "Bus not found" },
                { status: 404 }
            );
        }

        // --- 4. SAVE LOCATION TO DATABASE ---
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const spd = speed !== undefined && speed !== null ? parseFloat(speed) : null;

        let newLocation = null;
        // Record coordinates when valid
        if (!isNaN(lat) && !isNaN(lng)) {
            newLocation = await prisma.location.create({
                data: {
                    busId: parsedBusId,
                    latitude: lat,
                    longitude: lng,
                    speed: spd
                },
            });
        }

        // --- 5. OPTIMIZATION: KEEP ONLY 7 DAYS OF DATA ---
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

        // --- 6. HANDLE DRIVER BUTTON ALERTS (BREAKDOWN / DELAY / RESOLVED) ---
        if (alert && alert !== "NORMAL") {
            const currentRouteIds = bus.routeAssignments.map((ra) => ra.routeId);

            if (alert === "BREAKDOWN") {
                await prisma.bus.update({
                    where: { id: parsedBusId },
                    data: { status: "Breakdown" }
                });

                await prisma.activity_logs.create({
                    data: {
                        bus_id: parsedBusId,
                        event_type: "BREAKDOWN",
                        description: `Driver triggered breakdown alert on ${bus.busName}.`
                    }
                });

                await pusherServer.trigger("fleet-alerts", "bus-status-change", {
                    busId: parsedBusId,
                    busName: bus.busName,
                    licensePlate: bus.licensePlate,
                    status: "Breakdown",
                    routeIds: currentRouteIds,
                    driverName: bus.driverName,
                    driverPhone: bus.driverPhone,
                    title: `🚨 ${bus.busName} Breakdown`,
                    message: `Bus ${bus.busName} has encountered a breakdown or incident. Please seek alternative transportation immediately.`,
                    timestamp: new Date().toISOString()
                });

                sendAlertNotification(
                    `Emergency: ${bus.busName} Breakdown`,
                    `Bus ${bus.busName} (${bus.licensePlate}) has reported a breakdown. Passengers are advised to seek alternative transport.`
                ).catch((err) => console.error("Email dispatch failed:", err));
            }
            else if (alert === "DELAY") {
                await prisma.bus.update({
                    where: { id: parsedBusId },
                    data: { status: "Delayed" }
                });

                await prisma.activity_logs.create({
                    data: {
                        bus_id: parsedBusId,
                        event_type: "DELAY",
                        description: `Driver triggered delay alert on ${bus.busName}.`
                    }
                });

                await pusherServer.trigger("fleet-alerts", "bus-status-change", {
                    busId: parsedBusId,
                    busName: bus.busName,
                    licensePlate: bus.licensePlate,
                    status: "Delayed",
                    routeIds: currentRouteIds,
                    driverName: bus.driverName,
                    driverPhone: bus.driverPhone,
                    title: `⚠️ ${bus.busName} Service Delay`,
                    message: `Bus ${bus.busName} is experiencing unexpected delays. Arrival times may be extended.`,
                    timestamp: new Date().toISOString()
                });

                sendDelayNotification(bus.busName, 15, "unexpected traffic / route blockage")
                    .catch((err) => console.error("Email dispatch failed:", err));
            }
            else if (alert === "RESOLVED") {
                await prisma.bus.update({
                    where: { id: parsedBusId },
                    data: { status: "Active" }
                });

                await prisma.activity_logs.create({
                    data: {
                        bus_id: parsedBusId,
                        event_type: "RESOLVED",
                        description: `Driver cleared alert on ${bus.busName}; status reset to Active.`
                    }
                });

                await pusherServer.trigger("fleet-alerts", "bus-status-change", {
                    busId: parsedBusId,
                    busName: bus.busName,
                    status: "Active",
                    routeIds: currentRouteIds,
                    title: `✅ ${bus.busName} Resumed`,
                    message: `Bus ${bus.busName} has resumed normal operation.`,
                    timestamp: new Date().toISOString()
                });
            }
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