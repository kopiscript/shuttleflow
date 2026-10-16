// app/api/monitor-delays/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDelayNotification } from "@/lib/notifications";

// ─── Tunable thresholds ──────────────────────────────────────────────────
// A route is "delayed" when the traffic-aware travel time is at least
// DELAY_RATIO × the free-flow travel time.
//
// 1.5  = "50% slower than ideal"  → aggressive (many alerts)
// 1.7  = "70% slower than ideal"  → balanced (recommended)
// 2.0  = "100% slower than ideal" → conservative (only big jams)
const DELAY_RATIO = 1.7;

// Ignore very short trips — a 2-minute free-flow drive to 3 minutes is
// not a delay worth alerting on.
const MIN_FREE_FLOW_MINUTES = 3;

// Minimum absolute delay in minutes before alerting, to avoid
// noise on very short trips even if the ratio is high.
const MIN_DELAY_MINUTES = 4;

// One alert per route per cooldown window (in-memory; resets on restart)
const DELAY_ALERT_COOLDOWN_MS = 10 * 60 * 1000;
const lastDelayAlert: Record<number, number> = {};
// ─────────────────────────────────────────────────────────────────────────

function getBaseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  // Fallback: derive from the request itself (works locally)
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

// Shared coordinate validator
function isValidCoord(lat: unknown, lng: unknown): boolean {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  return (
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    !(latNum === 0 && lngNum === 0) &&
    Math.abs(latNum) <= 90 &&
    Math.abs(lngNum) <= 180
  );
}

export async function GET(request: Request) {
  try {
    // Optional: protect with CRON_SECRET in production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pull every active route that has an active bus assigned.
    const routes = await prisma.route.findMany({
      where: { status: "Active" },
      include: {
        busAssignments: {
          where: { endedAt: null },
          include: {
            bus: {
              include: {
                locations: {
                  orderBy: { recordedAt: "desc" },
                  take: 1,
                },
                deviceAssignments: {
                  where: { endedAt: null },
                  include: { device: true },
                },
              },
            },
          },
        },
      },
    });

    const baseUrl = getBaseUrl(request);
    const results: any[] = [];

    for (const route of routes) {
      // don't silently skip — report it
      if (route.busAssignments.length === 0) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          skipped: "no active bus assignment",
        });
        continue;
      }

      const bus = route.busAssignments[0].bus;

      if (bus.status !== "Active") {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          busId: bus.id,
          busName: bus.busName,
          skipped: "bus not Active",
        });
        continue;
      }

      // ── Validate route pickup coords FIRST (no need to even look at
      //    the bus if the destination is broken) ───────────────────────
      if (!isValidCoord(route.pickupLat, route.pickupLng)) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          skipped: "route pickup coordinates are invalid or missing",
          pickupLat: route.pickupLat,
          pickupLng: route.pickupLng,
        });
        continue;
      }

      // ── Validate latest location ────────────────────────────────────
      const latestLocation = bus.locations[0];

      if (!latestLocation) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          busId: bus.id,
          busName: bus.busName,
          skipped: "bus has never reported a location (no GPS pings)",
        });
        continue;
      }

      if (!isValidCoord(latestLocation.latitude, latestLocation.longitude)) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          busId: bus.id,
          busName: bus.busName,
          skipped: "bus location is invalid (0,0 or out of range)",
          rawLat: String(latestLocation.latitude),
          rawLng: String(latestLocation.longitude),
          recordedAt: latestLocation.recordedAt,
        });
        continue;
      }

      const busLat = Number(latestLocation.latitude);
      const busLng = Number(latestLocation.longitude);
      const pickupLat = Number(route.pickupLat);
      const pickupLng = Number(route.pickupLng);

      // ── Ensure the bus has an active device ─────────────────────────
      const device = bus.deviceAssignments[0]?.device;
      if (!device) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          busId: bus.id,
          busName: bus.busName,
          skipped: "no device assigned",
        });
        continue;
      }

      // ── Fetch ETA from the admin ETA endpoint ──────────────────────
      const etaUrl =
        `${baseUrl}/api/admin/eta?` +
        new URLSearchParams({
          originLat: String(busLat),
          originLng: String(busLng),
          destLat: String(pickupLat),
          destLng: String(pickupLng),
        });

      let etaRes: Response | null = null;
      let fetchError: unknown = null;

      try {
        // Forward the admin session cookie so /api/admin/eta doesn't 401
        const cookieHeader = request.headers.get("cookie") ?? "";
        etaRes = await fetch(etaUrl, {
          cache: "no-store",
          headers: cookieHeader ? { cookie: cookieHeader } : {},
        });
      } catch (err) {
        fetchError = err;
        etaRes = null;
      }

      if (!etaRes) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          skipped: "ETA fetch failed",
          reason: "network error",
          error:
            fetchError instanceof Error ? fetchError.message : String(fetchError),
          url: etaUrl,
        });
        continue;
      }

      if (!etaRes.ok) {
        const body = await etaRes.text().catch(() => "");
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          skipped: "ETA fetch failed",
          reason: `HTTP ${etaRes.status}`,
          body: body.slice(0, 300),
          url: etaUrl,
        });
        continue;
      }

      const etaData = await etaRes.json();

      if (!etaData?.success) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          skipped: "ETA fetch failed",
          reason: "API returned success:false",
          apiError: etaData?.error,
          url: etaUrl,
        });
        continue;
      }

      const realSec = Number(etaData.travelTimeSeconds) || 0;
      const freeSec = Number(etaData.noTrafficTravelTimeSeconds) || realSec;

      if (freeSec <= 0 || realSec <= 0) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          skipped: "invalid ETA values",
          travelTimeSeconds: etaData.travelTimeSeconds,
          noTrafficTravelTimeSeconds: etaData.noTrafficTravelTimeSeconds,
        });
        continue;
      }

      const freeMin = freeSec / 60;
      const realMin = realSec / 60;
      const ratio = realSec / freeSec;
      const delayMinutes = realMin - freeMin;

      // ── Decision ────────────────────────────────────────────────────
      const tooShort = freeMin < MIN_FREE_FLOW_MINUTES;
      const bigEnoughDelay = delayMinutes >= MIN_DELAY_MINUTES;
      const tooSlowRatio = ratio >= DELAY_RATIO;

      if (tooShort || !bigEnoughDelay || !tooSlowRatio) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          freeFlowMin: Math.round(freeMin),
          realMin: Math.round(realMin),
          ratio: Number(ratio.toFixed(2)),
          delayMinutes: Math.round(delayMinutes),
          alertSent: false,
        });
        continue;
      }

      // ── Cooldown check ──────────────────────────────────────────────
      const now = Date.now();
      const last = lastDelayAlert[route.id] ?? 0;
      if (now - last < DELAY_ALERT_COOLDOWN_MS) {
        results.push({
          routeId: route.id,
          routeName: route.routeName,
          freeFlowMin: Math.round(freeMin),
          realMin: Math.round(realMin),
          ratio: Number(ratio.toFixed(2)),
          delayMinutes: Math.round(delayMinutes),
          alertSent: false,
          cooldownRemainingSec: Math.round(
            (DELAY_ALERT_COOLDOWN_MS - (now - last)) / 1000
          ),
        });
        continue;
      }

      // ── Fire ────────────────────────────────────────────────────────
      lastDelayAlert[route.id] = now;

      await sendDelayNotification(
        route.routeName,
        Math.round(delayMinutes),
        "heavy traffic"
      );

      console.log(
        `⚠️ Delay alert: ${route.routeName} — ${Math.round(
          realMin
        )} min (free-flow ${Math.round(
          freeMin
        )} min, ratio ${ratio.toFixed(2)}×)`
      );

      results.push({
        routeId: route.id,
        routeName: route.routeName,
        freeFlowMin: Math.round(freeMin),
        realMin: Math.round(realMin),
        ratio: Number(ratio.toFixed(2)),
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