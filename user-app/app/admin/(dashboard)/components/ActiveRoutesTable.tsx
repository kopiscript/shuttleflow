"use client";

import { useEffect, useState } from "react";

interface BusRow {
  id: number;
  routeId: number | null;
  routeName: string | null;
  pickupStop: string | null;
  dropoffStop: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  lat: number | null;
  lng: number | null;
  lastSeen: string | null;
}

interface EtaResult {
  travelTimeSeconds: number;
  distanceMeters: number;
  trafficDelaySeconds: number;
  source: "tomtom" | "fallback";
}

// ---------- helpers ----------

const formatRelativeTime = (dateString: string | null): string => {
  if (!dateString) return "No signal";
  const diffSec = Math.max(
    0,
    Math.floor((Date.now() - new Date(dateString).getTime()) / 1000),
  );
  if (diffSec < 60) return `${diffSec}s ago`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m} min${m !== 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h !== 1 ? "s" : ""} ago`;
  return `${Math.floor(h / 24)} days ago`;
};

const formatEta = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDistance = (meters: number): string => {
  const km = meters / 1000;
  return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
};

const formatRouteId = (id: number | null): string => {
  if (id == null) return "—";
  return `R${String(id).padStart(3, "0")}`;
};

const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const FALLBACK_SPEED_KMH = 40;

const fallbackEta = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): EtaResult => {
  const km = haversineKm(fromLat, fromLng, toLat, toLng);
  const seconds = (km / FALLBACK_SPEED_KMH) * 3600;
  return {
    travelTimeSeconds: seconds,
    distanceMeters: km * 1000,
    trafficDelaySeconds: 0,
    source: "fallback",
  };
};

// Same pill colours as your other badges, just tuned for a dark card
const getStatusBadge = (eta: EtaResult | null, lastSeen: string | null) => {
  if (!lastSeen)
    return {
      label: "No Signal",
      classes: "bg-[#2C2D33] text-[#87888C]",
    };
  const ageMin = (Date.now() - new Date(lastSeen).getTime()) / 60000;
  if (ageMin > 10)
    return { label: "Delayed", classes: "bg-[#FFF4CC] text-[#B8860B]" };
  if (eta && eta.source === "tomtom" && eta.trafficDelaySeconds > 300)
    return { label: "Delayed", classes: "bg-[#FFF4CC] text-[#B8860B]" };
  return { label: "On Time", classes: "bg-[#E1FFDA] text-[#3EB900]" };
};

// ---------- component ----------

export default function ActiveRoutesTable() {
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [etas, setEtas] = useState<Record<number, EtaResult | null>>({});
  const [loading, setLoading] = useState(true);
  const [, forceTick] = useState(0);

  // Fetch buses every 5s
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch("/api/admin/buses");
        const data = await res.json();
        if (data.success) {
          const withRoutes = (data.buses ?? []).filter(
            (b: any) => b.routeId != null,
          );
          setBuses(withRoutes);
        }
      } catch (err) {
        console.error("Failed to fetch active routes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();
    const poll = setInterval(fetchBuses, 5000);
    const tick = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  // Recompute ETAs when positions change (throttled per-bus to every 20s)
  useEffect(() => {
    const lastFetched: Record<number, number> = {};

    const computeEtas = async () => {
      for (const bus of buses) {
        if (bus.lat == null || bus.lng == null) continue;
        if (bus.pickupLat  == null || bus.pickupLng  == null) continue;

        const now = Date.now();
        if (lastFetched[bus.id] && now - lastFetched[bus.id] < 20000) continue;
        lastFetched[bus.id] = now;

        try {
          const params = new URLSearchParams({
            originLat: String(bus.lat),
            originLng: String(bus.lng),
            destLat: String(bus.pickupLat),
            destLng: String(bus.pickupLng),
          });
          const res = await fetch(`/api/admin/eta?${params}`);
          const data = await res.json();

          if (data.success) {
            setEtas((prev) => ({
              ...prev,
              [bus.id]: {
                travelTimeSeconds: data.travelTimeSeconds,
                distanceMeters: data.distanceMeters,
                trafficDelaySeconds: data.trafficDelaySeconds,
                source: "tomtom",
              },
            }));
          } else {
            setEtas((prev) => ({
              ...prev,
              [bus.id]: fallbackEta(
                bus.lat!,
                bus.lng!,
                bus.pickupLat!,
                bus.pickupLng!,
              ),
            }));
          }
        } catch {
          setEtas((prev) => ({
            ...prev,
            [bus.id]: fallbackEta(
              bus.lat!,
              bus.lng!,
              bus.pickupLat!,
              bus.pickupLng!,
            ),
          }));
        }
      }
    };

    computeEtas();
    const poll = setInterval(computeEtas, 15000);
    return () => clearInterval(poll);
  }, [buses]);

  if (loading) {
    return (
      <div className="mt-6 bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
        <p className="text-[#87888C] font-['Inter'] text-sm">
          Loading active routes...
        </p>
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="mt-6 bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
        <h2 className="text-white font-bold font-['Inter'] text-base mb-2">
          Active Routes
        </h2>
        <p className="text-[#87888C] font-['Inter'] text-sm">
          No active routes right now.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-bold font-['Inter'] text-base">
            Active Routes
          </h2>
          <p className="text-[#87888C] font-['Inter'] text-xs mt-1">
            Live shuttle positions and estimated arrival times
          </p>
        </div>
        <span className="px-3 py-1 rounded-md text-xs font-semibold font-['Inter'] bg-[#E1FFDA] text-[#3EB900]">
          Live
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {buses.map((bus, i) => {
              const eta = etas[bus.id] ?? null;
              const badge = getStatusBadge(eta, bus.lastSeen);

              return (
                <tr
                  key={bus.id}
                  className={`border-t border-[#2C2D33] ${
                    i % 2 === 0 ? "bg-[#21222D]" : "bg-[#1D1E27]"
                  }`}
                >
                  {/* Route ID (R007, R011, ...) */}
                  <td className="py-4 pl-4 pr-4 align-middle whitespace-nowrap">
                    <span className="inline-block px-3 py-1 rounded-md text-sm font-bold font-['Inter'] bg-[#96DDFF] text-[#171821]">
                      {formatRouteId(bus.routeId)}
                    </span>
                  </td>

                  {/* Route name + ETA */}
                  <td className="py-4 pr-6 align-middle">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium font-['Inter'] text-sm">
                        {bus.pickupStop || "Unknown"}
                      </span>
                      <svg
                        className="w-4 h-4 text-[#87888C]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                      <span className="text-white font-medium font-['Inter'] text-sm">
                        {bus.dropoffStop || "Unknown"}
                      </span>
                      <span className="text-[#87888C] font-['Inter'] text-xs ml-2">
                        ETA to pickup {eta ? formatEta(eta.travelTimeSeconds) : "—"}
                      </span>
                    </div>
                  </td>

                  {/* Chips: Distance + Updated */}
                  <td className="py-4 pr-2 align-middle">
                    <div className="flex items-center gap-2 flex-wrap">
                      {eta && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium font-['Inter'] bg-[#171821] text-[#96DDFF] border border-[#2C2D33]">
                          To pickup: {formatDistance(eta.distanceMeters)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium font-['Inter'] bg-[#171821] text-[#87888C] border border-[#2C2D33]">
                        Updated {formatRelativeTime(bus.lastSeen)}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 pr-4 pl-2 align-middle text-right whitespace-nowrap">
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-xs font-semibold font-['Inter'] ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}