// app/api/monitor-delays/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDelayNotification } from "@/lib/notifications";

const DELAY_THRESHOLD_MINUTES = 5;
const DELAY_ALERT_COOLDOWN_MS = 10 * 60 * 1000; // one alert per route per 10 minutes

// In-memory cooldown per route. Resets on server restart.
const lastDelayAlert: Record<number, number> = {};

export async function GET(request: Request) {
  try {
    // Optional: protect with CRON_SECRET in production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const routes = await prisma.route.findMany({
      where: {
        status: "Active",
        expectedTripMinutes: { not: null },
      },
      include: {
        busAssignments: {
          where: { endedAt: null },
          include: { bus: true },
        },
      },
    });

    const results = [];

    for (const route of routes) {
      if (route.busAssignments.length === 0) continue;

      const bus = route.busAssignments[0].bus;

      // Skip if the bus isn't active
      if (bus.status !== "Active") {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          skipped: "bus not Active",
        });
        continue;
      }

      // Fetch the current ETA from the user-app's ETA endpoint.
      // We call the user-app because that's where the TomTom ETA logic lives.
      const userAppUrl =
        process.env.NEXT_PUBLIC_USER_APP_URL || "http://localhost:3000";

      const etaRes = await fetch(
        `${userAppUrl}/api/routes/${route.id}/eta`
      ).catch(() => null);

      if (!etaRes || !etaRes.ok) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          skipped: "ETA fetch failed",
        });
        continue;
      }

      const etaData = await etaRes.json();
      const etaMinutes = etaData?.eta?.minutes;

      if (typeof etaMinutes !== "number") {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          skipped: "no ETA in response",
        });
        continue;
      }

      const expected = route.expectedTripMinutes!;
      const delayMinutes = etaMinutes - expected;

      if (delayMinutes < DELAY_THRESHOLD_MINUTES) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          etaMinutes,
          expectedMinutes: expected,
          delayMinutes,
          alertSent: false,
        });
        continue;
      }

      // Delay detected — check cooldown
      const now = Date.now();
      const last = lastDelayAlert[route.id] ?? 0;
      const canSend = now - last > DELAY_ALERT_COOLDOWN_MS;

      if (!canSend) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          etaMinutes,
          delayMinutes,
          alertSent: false,
          cooldownRemaining: Math.round(
            (DELAY_ALERT_COOLDOWN_MS - (now - last)) / 1000
          ),
        });
        continue;
      }

      // Fire the notification
      lastDelayAlert[route.id] = now;

      await sendDelayNotification(
        route.routeName,
        Math.round(delayMinutes),
        "heavy traffic"
      );

      console.log(
        `⚠️ Delay alert: ${route.routeName} — ${Math.round(
          delayMinutes
        )} min behind expected`
      );

      results.push({
        routeId: route.id,
        routeName: route.routeName,
        etaMinutes,
        expectedMinutes: expected,
        delayMinutes: Math.round(delayMinutes),
        alertSent: true,
      });
    }

    return NextResponse.json({
      success: true,
      checked: routes.length,
      results,
    });
  } catch (error) {
    console.error("Delay monitor error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check delays" },
      { status: 500 }
    );
  }
}