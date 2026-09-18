"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import map (Leaflet requires browser environment)
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

export default function AdminDashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await fetch("/api/admin/routes");
        const data = await res.json();
        if (data.success) {
          // Only show routes that are active (bus assigned)
          const activeRoutes = data.routes.filter(
            (r: Route) => r.status === "Active"
          );
          setRoutes(activeRoutes);
        }
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

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
        <h2 className="text-white font-bold font-['Inter'] text-base mb-4">
          Active Route Map
        </h2>
        <div className="h-[500px] rounded-xl overflow-hidden">
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
            <RouteMarkersMap routes={routes} />
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
        </div>
      </div>
    </div>
  );
}