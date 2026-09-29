// app/admin/(dashboard)/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MostViewedRoutesChart from "./components/MostViewedRoutesChart";
import ActiveRoutesTable from "./components/ActiveRoutesTable";
import SmallDropdown from "./components/SmallDropdown";

const RouteMarkersMap = dynamic(() => import("./components/RouteMarkersMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#171821] flex items-center justify-center rounded-lg">
      <span className="text-[#87888C] font-['Inter'] text-sm">
        Loading map...
      </span>
    </div>
  ),
});

interface Route {
  id: number;
  routeName: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  status: string;
}

interface Bus {
  id: number;
  busName: string;
  lat: number;
  lng: number;
  routeId: number | null;
  routeName?: string;
  status?: string;
}

export default function AdminDashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, busesRes] = await Promise.all([
          fetch("/api/admin/routes"),
          fetch("/api/admin/buses"),
        ]);
        const routesData = await routesRes.json();
        const busesData = await busesRes.json();

        if (routesData.success) {
          setRoutes(
            routesData.routes.filter((r: Route) => r.status === "Active")
          );
        }
        if (busesData.success) {
          const validBuses = (busesData.buses ?? []).filter(
            (b: any) => b.lat != null && b.lng != null
          );
          setBuses(validBuses);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Convert to number for the map component
  const numericRouteId = selectedRouteId ? Number(selectedRouteId) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
        Dashboard
      </h1>
      <p className="text-[#87888C] mt-2 font-['Inter']">
        Welcome to the admin panel.
      </p>

      {/* Map Card */}
      <div className="mt-6 bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
        {/* Header — z-10 keeps the dropdown above the map */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-white font-bold font-['Inter'] text-base">
            Active Route Map
          </h2>

          <SmallDropdown
            value={selectedRouteId}
            onChange={setSelectedRouteId}
            options={[
              { value: "", label: "All Routes" },
              ...routes.map((r) => ({
                value: String(r.id),
                label: r.routeName,
              })),
            ]}
            width="w-48"
          />
        </div>

        {/* Map wrapper — z-0 so it never overrides the dropdown */}
        <div className="relative z-0 h-[500px] rounded-xl overflow-hidden">
          {loading ? (
            <div className="w-full h-full bg-[#171821] flex items-center justify-center">
              <span className="text-[#87888C] font-['Inter'] text-sm">
                Loading map...
              </span>
            </div>
          ) : routes.length === 0 ? (
            <div className="w-full h-full bg-[#171821] flex items-center justify-center">
              <p className="text-[#87888C] font-['Inter'] text-sm">
                No active routes to display. Assign a bus to a route to see it
                here.
              </p>
            </div>
          ) : (
            <RouteMarkersMap
              routes={routes}
              buses={buses}
              selectedRouteId={numericRouteId}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#1A4B9B]"></div>
            <span className="text-[#87888C] font-['Inter'] text-xs">
              Pickup Stop
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3EB900]"></div>
            <span className="text-[#87888C] font-['Inter'] text-xs">
              Drop-off Stop
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FEB002]"></div>
            <span className="text-[#87888C] font-['Inter'] text-xs">
              Active Bus
            </span>
          </div>
        </div>
      </div>

      {/* Active routes table */}
      <div className="mt-6">
        <ActiveRoutesTable />
      </div>

      {/* Most Viewed Routes Chart */}
      <div className="mt-6">
        <MostViewedRoutesChart />
      </div>
    </div>
  );
}