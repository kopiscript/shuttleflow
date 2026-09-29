import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const routeIdParam = searchParams.get("routeId");
    const rangeParam = searchParams.get("range") || "7d";

    const routeId = routeIdParam ? parseInt(routeIdParam) : null;
    const days = rangeParam === "30d" ? 30 : 7;

    // Get "today" in Malaysia timezone (UTC+8)
    const now = new Date();
    const malaysiaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
    );

    // Start date = N days ago at midnight (Malaysia time)
    const startDate = new Date(malaysiaTime);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // ✅ Fetch ALL routes (no status filter)
    const routes = await prisma.route.findMany({
      select: { id: true, routeName: true },
      orderBy: { routeName: "asc" },
    });

    // Build where clause
    const queryStart = new Date(startDate);
    queryStart.setHours(queryStart.getHours() - 8);

    const whereClause: any = {
      viewedAt: {
        gte: queryStart,
      },
    };
    if (routeId) {
      whereClause.routeId = routeId;
    }

    const views = await prisma.routeView.findMany({
      where: whereClause,
      select: {
        routeId: true,
        viewedAt: true,
        route: {
          select: { routeName: true },
        },
      },
    });

    // Build date buckets
    const dateBuckets: { [key: string]: { [routeId: number]: number } } = {};
    const routeNames: { [routeId: number]: string } = {};

    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kuala_Lumpur",
      });
      dateBuckets[key] = {};
    }

    // Fill in view counts
    for (const view of views) {
      const viewDate = new Date(
        view.viewedAt.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
      );
      const key = viewDate.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kuala_Lumpur",
      });
      if (!dateBuckets[key]) continue;
      if (!dateBuckets[key][view.routeId]) {
        dateBuckets[key][view.routeId] = 0;
      }
      dateBuckets[key][view.routeId] += 1;
      routeNames[view.routeId] = view.route.routeName;
    }

    // ✅ Format for chart — include ALL routes (0 views = line at 0)
    const chartData = Object.keys(dateBuckets).map((date) => {
      const entry: any = { date };

      if (routeId) {
        // Single route mode — use route name even if no views
        const targetRoute = routes.find((r) => r.id === routeId);
        const routeName = targetRoute?.routeName || routeNames[routeId] || "Selected Route";
        entry[routeName] = dateBuckets[date][routeId] || 0;
      } else {
        // All routes mode — include every route
        for (const r of routes) {
          entry[r.routeName] = dateBuckets[date][r.id] || 0;
        }
      }
      return entry;
    });

    // ✅ Series = ALL routes
    const series = routeId
      ? [
          {
            id: routeId,
            name:
              routes.find((r) => r.id === routeId)?.routeName ||
              routeNames[routeId] ||
              "Selected Route",
          },
        ]
      : routes.map((r) => ({ id: r.id, name: r.routeName }));

    const totalViews = views.length;

    return NextResponse.json({
      success: true,
      chartData,
      series,
      routes,
      totalViews,
      range: rangeParam,
    });
  } catch (error) {
    console.error("Most viewed routes error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}