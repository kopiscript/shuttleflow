// app/admin/(dashboard)/components/ActiveRoutesTable.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import SmallDropdown from "./SmallDropdown";

export type BusState =
  | "approaching"
  | "at_pickup"
  | "en_route_to_dropoff"
  | "trip_done";

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
  deviceStatus: string | null;
  busStatus: string | null;
  busState: BusState;
  device?: {
    id: number;
    deviceName: string;
    status: string;
    lastSeen: string | null;
    lastLat?: number | null;
    lastLng?: number | null;
  } | null;
}

interface EtaResult {
  travelTimeSeconds: number;
  noTrafficTravelTimeSeconds: number;
  distanceMeters: number;
  trafficDelaySeconds: number;
  source: "tomtom" | "fallback";
  routePath: [number, number][] | null;
  dropoffPath: [number, number][] | null;
  etaDestination: "pickup" | "dropoff";
}

interface ActiveRoutesTableProps {
  onEtaUpdate?: (etas: Record<number, EtaResult | null>) => void;
  selectedRouteId?: number | null;
  onBusStateUpdate?: (state: BusState) => void;
}

const STALE_MINUTES = 10;
const ETA_CACHE_MS = 2 * 60 * 1000;

const DELAY_RATIO = 1.7;
const MIN_FREE_FLOW_MINUTES = 3;
const MIN_DELAY_MINUTES = 4;

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
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
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
  etaDestination: "pickup" | "dropoff",
): EtaResult => {
  const km = haversineKm(fromLat, fromLng, toLat, toLng);
  const seconds = (km / FALLBACK_SPEED_KMH) * 3600;
  return {
    travelTimeSeconds: seconds,
    noTrafficTravelTimeSeconds: seconds,
    distanceMeters: km * 1000,
    trafficDelaySeconds: 0,
    source: "fallback",
    routePath: null,
    dropoffPath: null,
    etaDestination,
  };
};

const decodePolyline = (encoded: string): [number, number][] => {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let byte: number;
    let shift = 0;
    let result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
};

const isValidCoord = (lat: unknown, lng: unknown): lat is number =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  !(lat === 0 && lng === 0) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

const normalisePolyline = (raw: unknown): [number, number][] | null => {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    const out: [number, number][] = [];
    for (const p of raw) {
      if (p && typeof p === "object" && "latitude" in p && "longitude" in p) {
        const lat = (p as any).latitude;
        const lng = (p as any).longitude;
        if (isValidCoord(lat, lng)) out.push([lat, lng]);
        continue;
      }
      if (Array.isArray(p) && p.length >= 2) {
        const lat = p[0];
        const lng = p[1];
        if (isValidCoord(lat, lng)) out.push([lat, lng]);
        continue;
      }
    }
    return out.length > 1 ? out : null;
  }

  if (typeof raw === "string" && raw.length > 0) {
    try {
      const decoded = decodePolyline(raw);
      const cleaned = decoded.filter(([lat, lng]) => isValidCoord(lat, lng));
      return cleaned.length > 1 ? cleaned : null;
    } catch (err) {
      console.error("Failed to decode polyline:", err);
      return null;
    }
  }

  return null;
};

const getStatusBadge = (
  eta: EtaResult | null,
  locationLastSeen: string | null,
  deviceLastSeen: string | null,
  deviceStatus: string | null,
  busStatus: string | null,
) => {
  if (busStatus === "Breakdown") {
    return { label: "Breakdown", classes: "bg-[#FFE4E4] text-[#EA1701]" };
  }
  if (busStatus === "Delayed") {
    return { label: "Delayed", classes: "bg-[#FFF4CC] text-[#B8860B]" };
  }

  if (deviceStatus === "Offline" || deviceStatus === "Never Connected") {
    return { label: "No Signal", classes: "bg-[#2C2D33] text-[#87888C]" };
  }

  if (!locationLastSeen && !deviceLastSeen) {
    return { label: "No Signal", classes: "bg-[#2C2D33] text-[#87888C]" };
  }

  const deviceAgeMin = deviceLastSeen
    ? (Date.now() - new Date(deviceLastSeen).getTime()) / 60000
    : Infinity;

  const locationAgeMin = locationLastSeen
    ? (Date.now() - new Date(locationLastSeen).getTime()) / 60000
    : Infinity;

  if (deviceAgeMin > STALE_MINUTES || locationAgeMin > STALE_MINUTES) {
    return { label: "No Signal", classes: "bg-[#2C2D33] text-[#87888C]" };
  }

  if (eta && eta.source === "tomtom") {
    const freeMin = eta.noTrafficTravelTimeSeconds / 60;
    const realMin = eta.travelTimeSeconds / 60;
    const delayMin = realMin - freeMin;

    if (freeMin >= MIN_FREE_FLOW_MINUTES) {
      const ratio = realMin / Math.max(freeMin, 0.01);
      if (ratio >= DELAY_RATIO && delayMin >= MIN_DELAY_MINUTES) {
        return { label: "Delayed", classes: "bg-[#FFF4CC] text-[#B8860B]" };
      }
    }
  }

  return { label: "On Time", classes: "bg-[#E1FFDA] text-[#3EB900]" };
};

export default function ActiveRoutesTable({
  onEtaUpdate,
  selectedRouteId = null,
  onBusStateUpdate,
}: ActiveRoutesTableProps) {
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [etas, setEtas] = useState<Record<number, EtaResult | null>>({});
  const [loading, setLoading] = useState(true);
  const [, forceTick] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [routeFilter, setRouteFilter] = useState<string>("");

  const onEtaUpdateRef = useState(() => ({ current: onEtaUpdate }))[0];
  onEtaUpdateRef.current = onEtaUpdate;

  const onBusStateUpdateRef = useState(() => ({ current: onBusStateUpdate }))[0];
  onBusStateUpdateRef.current = onBusStateUpdate;

  const selectedRouteIdRef = useState<{
    current: number | null;
  }>(() => ({ current: selectedRouteId }))[0];
  selectedRouteIdRef.current = selectedRouteId;

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const [busesRes, routesRes] = await Promise.all([
          fetch("/api/admin/buses"),
          fetch("/api/admin/routes"),
        ]);
        const [busesData, routesData] = await Promise.all([
          busesRes.json(),
          routesRes.json(),
        ]);

        if (busesData.success && routesData.success) {
          const activeRouteIds = new Set<number>(
            (routesData.routes ?? [])
              .filter((r: any) => r.status === "Active")
              .map((r: any) => Number(r.id)),
          );

          const withRoutes: BusRow[] = (busesData.buses ?? [])
            .filter(
              (b: any) =>
                b.routeId != null && activeRouteIds.has(Number(b.routeId)),
            )
            .map((b: any) => ({
              ...b,
              deviceStatus: b.device?.status ?? b.deviceStatus ?? null,
              busStatus: b.status ?? null,
              busState: (b.busState ?? "approaching") as BusState,
            }));

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

  useEffect(() => {
    if (selectedRouteId == null) {
      onBusStateUpdateRef.current?.("approaching");
      return;
    }
    const selectedBus = buses.find(
      (b) => Number(b.routeId) === Number(selectedRouteId),
    );
    onBusStateUpdateRef.current?.(selectedBus?.busState ?? "approaching");
  }, [buses, selectedRouteId]);

  useEffect(() => {
    const lastFetched: Record<string, number> = {};
    let cancelled = false;

    const computeEtas = async () => {
      const nextEtas: Record<number, EtaResult | null> = {};

      for (const bus of buses) {
        const now = Date.now();

        if (bus.deviceStatus === "Offline") {
          nextEtas[bus.id] = null;
          continue;
        }
        if (bus.lat == null || bus.lng == null) {
          nextEtas[bus.id] = etas[bus.id] ?? null;
          continue;
        }

        const etaDestination: "pickup" | "dropoff" =
          bus.busState === "at_pickup" ||
          bus.busState === "en_route_to_dropoff"
            ? "dropoff"
            : "pickup";

        const destLat =
          etaDestination === "dropoff" ? bus.dropoffLat : bus.pickupLat;
        const destLng =
          etaDestination === "dropoff" ? bus.dropoffLng : bus.pickupLng;

        if (destLat == null || destLng == null) {
          nextEtas[bus.id] = etas[bus.id] ?? null;
          continue;
        }

        const etaKey = `eta:${bus.id}:${etaDestination}:${destLat},${destLng}`;
        const cached =
          lastFetched[etaKey] && now - lastFetched[etaKey] < ETA_CACHE_MS;

        if (cached) {
          nextEtas[bus.id] = etas[bus.id] ?? null;
          continue;
        }

        lastFetched[etaKey] = now;

        try {
          const res = await fetch(
            `/api/admin/eta?${new URLSearchParams({
              originLat: String(bus.lat),
              originLng: String(bus.lng),
              destLat: String(destLat),
              destLng: String(destLng),
            })}`,
          );
          const data = await res.json();

          if (cancelled) return;

          const previous = etas[bus.id] ?? null;

          if (data.success) {
            const polyline = normalisePolyline(data.encodedPolyline);

            nextEtas[bus.id] = {
              travelTimeSeconds: data.travelTimeSeconds,
              noTrafficTravelTimeSeconds:
                data.noTrafficTravelTimeSeconds ?? data.travelTimeSeconds,
              distanceMeters: data.distanceMeters,
              trafficDelaySeconds: data.trafficDelaySeconds,
              source: "tomtom",
              routePath:
                etaDestination === "pickup"
                  ? polyline
                  : previous?.routePath ?? null,
              dropoffPath:
                etaDestination === "dropoff"
                  ? polyline
                  : previous?.dropoffPath ?? null,
              etaDestination,
            };
          } else {
            nextEtas[bus.id] = fallbackEta(
              bus.lat,
              bus.lng,
              destLat,
              destLng,
              etaDestination,
            );
          }
        } catch {
          if (cancelled) return;
          const prev = etas[bus.id];
          if (prev) {
            nextEtas[bus.id] = prev;
          } else {
            nextEtas[bus.id] = fallbackEta(
              bus.lat,
              bus.lng,
              destLat,
              destLng,
              etaDestination,
            );
          }
        }
      }

      if (cancelled) return;
      setEtas(nextEtas);
      onEtaUpdateRef.current?.(nextEtas);
    };

    computeEtas();
    const poll = setInterval(computeEtas, ETA_CACHE_MS);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buses, selectedRouteId]);

  const routeOptions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const bus of buses) {
      if (bus.routeId == null) continue;
      if (!seen.has(bus.routeId)) {
        seen.set(bus.routeId, formatRouteId(bus.routeId));
      }
    }
    return Array.from(seen.entries())
      .sort(([a], [b]) => a - b)
      .map(([id, label]) => ({ value: String(id), label }));
  }, [buses]);

  const filteredBuses = useMemo(() => {
    return buses.filter((bus) => {
      if (routeFilter && String(bus.routeId) !== routeFilter) return false;

      if (statusFilter !== "all") {
        const eta = etas[bus.id] ?? null;
        const badge = getStatusBadge(
          eta,
          bus.lastSeen,
          bus.device?.lastSeen ?? null,
          bus.deviceStatus,
          bus.busStatus,
        );
        const normalized = badge.label.toLowerCase().replace(/\s+/g, "-");
        if (normalized !== statusFilter) return false;
      }
      return true;
    });
  }, [buses, etas, routeFilter, statusFilter]);

  if (loading) {
    return (
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
        <p className="text-[#87888C] font-['Inter'] text-sm">
          Loading active routes...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-4 lg:p-6">
      {/* Header - Stacks vertically on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-bold font-['Inter'] text-base">
            Active Routes
          </h2>
          <p className="text-[#87888C] font-['Inter'] text-xs mt-1">
            {filteredBuses.length} route{filteredBuses.length !== 1 ? "s" : ""}{" "}
            {statusFilter === "all" ? "running" : `showing "${statusFilter}"`}
          </p>
        </div>

        {/* Dropdowns wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <SmallDropdown
            value={routeFilter}
            onChange={setRouteFilter}
            options={[{ value: "", label: "All Routes" }, ...routeOptions]}
            width="w-full sm:w-48"
          />

          <SmallDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Status" },
              { value: "on-time", label: "On Time" },
              { value: "delayed", label: "Delayed" },
              { value: "breakdown", label: "Breakdown" },
              { value: "no-signal", label: "No Signal" },
            ]}
            width="w-full sm:w-36"
          />

          <span className="px-3 py-2 rounded-lg text-xs font-semibold font-['Inter'] bg-[#E1FFDA] text-[#3EB900] flex-shrink-0">
            Live
          </span>
        </div>
      </div>

      {filteredBuses.length === 0 ? (
        <div className="h-[150px] flex items-center justify-center">
          <p className="text-[#87888C] font-['Inter'] text-sm">
            No routes match the selected filters.
          </p>
        </div>
      ) : (
        /* Changed from a Table to a Flexbox List for better mobile wrapping */
        <div className="flex flex-col gap-3">
          {filteredBuses.map((bus, i) => {
            const eta = etas[bus.id] ?? null;
            const badge = getStatusBadge(
              eta,
              bus.lastSeen,
              bus.device?.lastSeen ?? null,
              bus.deviceStatus,
              bus.busStatus,
            );
            const isOffline = bus.deviceStatus === "Offline";
            const showEta = !isOffline && eta !== null;
            const isBreakdown = bus.busStatus === "Breakdown";
            const isDelayed = bus.busStatus === "Delayed";

            const etaLabel =
              eta?.etaDestination === "dropoff"
                ? "To Drop-off"
                : "To Pickup";

            return (
              <div
                key={bus.id}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-[#2C2D33] ${
                  isBreakdown
                    ? "bg-[#1f1515]"
                    : isDelayed
                    ? "bg-[#1e1c10]"
                    : i % 2 === 0
                    ? "bg-[#21222D]"
                    : "bg-[#1D1E27]"
                }`}
              >
                
                {/* Left Side: Route ID and Stops */}
                <div className="flex items-start md:items-center gap-3 w-full md:w-auto">
                  <span className="inline-block px-3 py-1 rounded-md text-sm font-bold font-['Inter'] bg-[#96DDFF] text-[#171821] whitespace-nowrap mt-1 md:mt-0">
                    {formatRouteId(bus.routeId)}
                  </span>

                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                    <span className="text-white font-medium font-['Inter'] text-sm">
                      {bus.pickupStop || "Unknown"}
                    </span>
                    <svg
                      className="w-4 h-4 text-[#87888C] hidden md:block"
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
                    <span className="text-[#87888C] font-['Inter'] text-xs md:ml-2 mt-1 md:mt-0">
                      ETA{" "}
                      {showEta && eta ? formatEta(eta.travelTimeSeconds) : "—"}
                    </span>
                  </div>
                </div>

                {/* Right Side: Badges (Distance, Updated, Status) */}
                <div className="flex flex-wrap items-center gap-2 md:justify-end w-full md:w-auto">
                  {showEta && eta && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium font-['Inter'] bg-[#171821] text-[#96DDFF] border border-[#2C2D33]">
                      {etaLabel}: {formatDistance(eta.distanceMeters)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium font-['Inter'] bg-[#171821] text-[#87888C] border border-[#2C2D33]">
                    Updated {formatRelativeTime(bus.lastSeen)}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-semibold font-['Inter'] ${badge.classes}`}
                  >
                    {badge.label}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}