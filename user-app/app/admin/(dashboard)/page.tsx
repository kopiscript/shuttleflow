// app/admin/(dashboard)/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import MostViewedRoutesChart from "./components/MostViewedRoutesChart";
import ActiveRoutesTable, { type BusState } from "./components/ActiveRoutesTable";
import SmallDropdown from "./components/SmallDropdown";
import UnresolvedTicketsCard from "./components/UnresolvedTicketsCard";

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

const downloadCumulativeBusData = async () => {
  try {
    // Fetch up to 5000 recent pings for the cumulative export
    const res = await fetch("/api/admin/bus-logs?export=true");
    const data = await res.json();

    if (!data.success || data.logs.length === 0) {
      alert("No location data available to export.");
      return;
    }

    const headers = ["Log ID", "Bus", "Plate", "Lat", "Lng", "Speed", "Time"];
    const csvRows = data.logs.map((l: any) => [
      l.id, l.bus?.bus_name, l.bus?.license_plate, l.latitude, l.longitude, l.speed || "0", new Date(l.recorded_at).toISOString()
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cumulative_fleet_telemetry_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  } catch (err) {
    console.error("Export failed", err);
  }
};

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

interface TicketPreview {
  id: number;
  reportType: string;
}

export default function AdminDashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  /** routeId → bus operational status ("Active" | "Delayed" | "Breakdown") */
  const [routeBusStatus, setRouteBusStatus] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  // the currently selected bus's state, fed by ActiveRoutesTable
  const [busState, setBusState] = useState<BusState>("approaching");

  const [unresolvedTickets, setUnresolvedTickets] = useState(0);
  const [unresolvedTicketList, setUnresolvedTicketList] = useState<TicketPreview[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [routePaths, setRoutePaths] = useState<
    Record<number, [number, number][] | null>
  >({});
  const [dropoffPaths, setDropoffPaths] = useState<
    Record<number, [number, number][] | null>
  >({});

  useEffect(() => {
    const monitorDelays = async () => {
      try {
        console.log("Checking for delays...");
        await fetch("/api/monitor-delays");
      } catch (error) {
        console.error("Failed to run delay monitor:", error);
      }
    };

    // Run every 5 minutes
    const interval = setInterval(monitorDelays, 5 * 60 * 1000);

    // Also run once on initial load
    monitorDelays();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setTicketsLoading(true);
        const [routesRes, busesRes, ticketsRes] = await Promise.all([
          fetch("/api/admin/routes"),
          fetch("/api/admin/buses"),
          fetch("/api/admin/support-tickets?status=unresolved"),
        ]);
        const routesData = await routesRes.json();
        const busesData = await busesRes.json();
        const ticketsData = await ticketsRes.json();

        if (routesData.success) {
          setRoutes(
            routesData.routes.filter((r: Route) => r.status === "Active")
          );
        }
        if (busesData.success) {
          const allBuses: any[] = busesData.buses ?? [];
          // Only GPS-valid buses go to the map
          const validBuses = allBuses.filter(
            (b: any) => b.lat != null && b.lng != null
          );
          setBuses(validBuses);
          // Build routeId → busStatus from ALL buses (regardless of GPS)
          const statusMap: Record<number, string> = {};
          for (const b of allBuses) {
            if (b.routeId != null && b.status) {
              statusMap[Number(b.routeId)] = b.status;
            }
          }
          setRouteBusStatus(statusMap);
        }
        if (ticketsData.success) {
          setUnresolvedTickets(ticketsData.count ?? 0);
          setUnresolvedTicketList(ticketsData.tickets ?? []);
        } else {
          setUnresolvedTickets(0);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setUnresolvedTickets(0);
      } finally {
        setLoading(false);
        setTicketsLoading(false);
      }
    };
    fetchData();
  }, []);

  const numericRouteId = selectedRouteId ? Number(selectedRouteId) : null;

  return (

    <div className="space-y-4">
      {/* Header row */}
      <div>
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Dashboard
        </h1>
        <p className="text-[#87888C] mt-1 font-['Inter'] text-sm">
          Welcome to the admin panel.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map card — row 1, cols 1-3 */}
        <div className="lg:col-span-3 bg-[#21222D] rounded-2xl border border-[#2C2D33] p-4 flex flex-col">
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between gap-6 mb-3">
            <h2 className="text-white font-bold font-['Inter'] shrink-0">
              Active Route Map
            </h2>

            <div className="flex-1 min-w-0">
              <SmallDropdown
                value={selectedRouteId}
                onChange={setSelectedRouteId}
                options={[
                  { value: "", label: "All Routes" },
                  ...routes.map((r) => {
                    const busStatus = routeBusStatus[r.id];
                    const statusSuffix =
                      busStatus === "Breakdown"
                        ? " ⚠ Breakdown"
                        : busStatus === "Delayed"
                          ? " · Delayed"
                          : "";
                    return {
                      value: String(r.id),
                      label: r.routeName + statusSuffix,
                    };
                  }),
                ]}
                width="w-full"
              />
            </div>
          </div>

          {/* Map area — explicit height so Leaflet has a bounded box */}
          <div className="relative z-0 h-[400px] rounded-xl overflow-hidden">
            {loading ? (
              <div className="w-full h-full bg-[#171821] flex items-center justify-center">
                <span className="text-[#87888C] font-['Inter'] text-sm">
                  Loading map...
                </span>
              </div>
            ) : routes.length === 0 ? (
              <div className="w-full h-full bg-[#171821] flex items-center justify-center">
                <p className="text-[#87888C] font-['Inter'] text-sm">
                  No active routes to display. Assign a bus to a route to see
                  it here.
                </p>
              </div>
            ) : (
              <RouteMarkersMap
                routes={routes}
                buses={buses}
                selectedRouteId={numericRouteId}
                routePaths={routePaths}
                dropoffPaths={dropoffPaths}
                busState={busState}
              />
            )}
          </div>

          {/* Legend + note — natural height, no clipping */}
          <div className="mt-3">
            <div className="flex items-center gap-4 flex-wrap text-[11px]">
              <div className="flex items-center gap-1.5">
                <svg width="10" height="14" viewBox="0 0 36 44">
                  <path
                    d="M17 1 C 8.16 1 1 8.16 1 17 C 1 29 17 43 17 43
                       C 17 43 33 29 33 17 C 33 8.16 25.84 1 17 1 Z"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  <text
                    x="17"
                    y="20"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="13"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    P
                  </text>
                </svg>
                <span className="text-[#87888C] font-['Inter']">
                  Pickup Stop
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <svg width="10" height="14" viewBox="0 0 36 44">
                  <path
                    d="M17 1 C 8.16 1 1 8.16 1 17 C 1 29 17 43 17 43
                       C 17 43 33 29 33 17 C 33 8.16 25.84 1 17 1 Z"
                    fill="#bb0c0c"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  <text
                    x="17"
                    y="20"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Inter, sans-serif"
                    fontSize="13"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    D
                  </text>
                </svg>
                <span className="text-[#87888C] font-['Inter']">
                  Drop-off Stop
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEB002]"></div>
                <span className="text-[#87888C] font-['Inter']">
                  Active Bus
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <svg width="18" height="6" viewBox="0 0 26 8">
                  <line
                    x1="1"
                    y1="4"
                    x2="23"
                    y2="4"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[#87888C] font-['Inter']">
                  Bus → Pickup
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <svg width="18" height="6" viewBox="0 0 26 8">
                  <line
                    x1="1"
                    y1="4"
                    x2="23"
                    y2="4"
                    stroke="#bb0c0c"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[#87888C] font-['Inter']">
                  Bus → Drop-off
                </span>
              </div>
            </div>

            <p className="text-[#87888C] font-['Inter'] text-[12px] mt-2 leading-4">
              <span className="text-[#96DDFF] font-semibold">Note:</span>{" "}
              Solid road-following lines are only drawn for{" "}
              <span className="text-white">online devices</span>. Offline
              devices show a{" "}
              <span className="text-white">dashed straight line</span>.
            </p>
          </div>
        </div>

        {/* Unresolved tickets card — row 1, col 4.
         *  `self-start` keeps it at its natural height instead of
         *  stretching to fill the taller map card. */}
        <div className="lg:col-span-1">
          <UnresolvedTicketsCard
            count={unresolvedTickets}
            tickets={unresolvedTicketList}
            loading={ticketsLoading}
          />
        </div>

        {/* Active Routes Table — row 2, all 4 cols */}
        <div className="lg:col-span-4">
          <ActiveRoutesTable
            selectedRouteId={numericRouteId}
            onEtaUpdate={(etas) => {
              const pickup: Record<number, [number, number][] | null> = {};
              const dropoff: Record<number, [number, number][] | null> = {};
              for (const [busId, eta] of Object.entries(etas)) {
                pickup[Number(busId)] = eta?.routePath ?? null;
                dropoff[Number(busId)] = eta?.dropoffPath ?? null;
              }
              setRoutePaths(pickup);
              setDropoffPaths(dropoff);
            }}
            onBusStateUpdate={setBusState}
          />
        </div>

        {/* Most Viewed Routes Chart — row 3, all 4 cols */}
        <div className="lg:col-span-4">
          <MostViewedRoutesChart />
        </div>
      </div>
    </div>
  );
}