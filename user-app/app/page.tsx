// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import PageShell from "../components/PageShell";
import CustomDropdown from "../components/CustomDropdown";
import { useLanguage } from "../context/LanguageContext";

const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
      <span className="text-gray-500 dark:text-gray-400">Loading map...</span>
    </div>
  ),
});

interface Route {
  id: number;
  routeName: string;
  pickupStop: string;
  dropoffStop: string;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupLat?: number;
  pickupLng?: number;
}

interface ETAData {
  minutes: number;
  minutesDisplay: string;
  arrivalTime: string;
  fullDisplay: string;
  distance: string;
  pickupStop: string;
  speed: string | null;
}

interface ProximityData {
  isNear: boolean;
  distance: number;
  destination: string;
  status: string;
  busState: "approaching" | "at_pickup" | "en_route_to_dropoff" | "trip_done";
}

// ---- Polyline helpers ----
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

export default function HomePage() {
  const { t } = useLanguage();
  const [selectedRoute, setSelectedRoute] = useState("");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [etaData, setEtaData] = useState<ETAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busLocation, setBusLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [proximityData, setProximityData] = useState<ProximityData | null>(
    null
  );

  // ✅ Path state
  const [pickupPath, setPickupPath] = useState<[number, number][] | null>(null);
  const [dropoffPath, setDropoffPath] = useState<[number, number][] | null>(
    null
  );
  const [busState, setBusState] = useState<
    "approaching" | "at_pickup" | "en_route_to_dropoff" | "trip_done"
  >("approaching");

  // Fetch routes
  useEffect(() => {
    fetch("/api/routes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const sortedRoutes = data.routes.sort((a: Route, b: Route) => {
            if (a.id === 1) return -1;
            if (b.id === 1) return 1;
            return a.id - b.id;
          });
          setRoutes(sortedRoutes);
          const url = new URL(window.location.href);
          const savedRouteId = url.searchParams.get("routeId");
          const routeExists = sortedRoutes.some(
            (route: Route) => String(route.id) === savedRouteId
          );
          setSelectedRoute(routeExists && savedRouteId ? savedRouteId : "");
          if (savedRouteId !== null && !routeExists) {
            url.searchParams.delete("routeId");
            window.history.replaceState(window.history.state, "", url.toString());
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch routes:", err);
        setLoading(false);
      });
  }, []);

  // Bus location + proximity (also stores busState)
  useEffect(() => {
    const fetchBusLocation = async () => {
      try {
        const response = await fetch("/api/locations");
        const data = await response.json();
        if (data.success && data.locations?.length > 0) {
          const loc = data.locations[0];
          setBusLocation({
            lat: parseFloat(loc.latitude),
            lng: parseFloat(loc.longitude),
          });
        }
      } catch (error) {
        console.error("Failed to fetch bus location:", error);
      }

      if (selectedRoute) {
        try {
          const res = await fetch(`/api/bus/proximity?routeId=${selectedRoute}`);
          const data = await res.json();

          if (data.success && data.data) {
            setProximityData({
              isNear: data.data.isNearPickup,
              distance: data.data.distanceToPickup,
              destination: data.data.pickupStop,
              status: data.data.status,
              busState: data.data.busState,
            });
            setBusState(data.data.busState);
          } else {
            setProximityData(null);
          }
        } catch (err) {
          console.error("Proximity check failed:", err);
          setProximityData(null);
        }
      } else {
        setProximityData(null);
      }
    };

    fetchBusLocation();
    const interval = setInterval(fetchBusLocation, 5000);
    return () => clearInterval(interval);
  }, [selectedRoute]);

  // ETA
  useEffect(() => {
    if (!selectedRoute) {
      setEtaData(null);
      return;
    }

    const fetchEta = async () => {
      try {
        const response = await fetch(`/api/routes/${selectedRoute}/eta`);
        const data = await response.json();
        if (data.success) {
          setEtaData(data.eta);
        } else {
          setEtaData(null);
        }
      } catch (err) {
        console.error("Failed to fetch ETA:", err);
        setEtaData(null);
      }
    };

    fetchEta();
    const interval = setInterval(fetchEta, 10000);
    return () => clearInterval(interval);
  }, [selectedRoute]);

  // ✅ NEW: Fetch both paths (bus → pickup and bus → dropoff)
  useEffect(() => {
    if (!selectedRoute) {
      setPickupPath(null);
      setDropoffPath(null);
      return;
    }

    const fetchPaths = async () => {
      try {
        const [pickupRes, dropoffRes] = await Promise.all([
          fetch(`/api/routes/${selectedRoute}/eta`),
          fetch(`/api/routes/${selectedRoute}/eta?to=dropoff`),
        ]);
        const pickupData = await pickupRes.json();
        const dropoffData = await dropoffRes.json();

        if (pickupData.success && pickupData.eta?.encodedPolyline) {
          setPickupPath(normalisePolyline(pickupData.eta.encodedPolyline));
        } else {
          setPickupPath(null);
        }

        if (dropoffData.success && dropoffData.eta?.encodedPolyline) {
          setDropoffPath(normalisePolyline(dropoffData.eta.encodedPolyline));
        } else {
          setDropoffPath(null);
        }
      } catch (err) {
        console.error("Failed to fetch paths:", err);
      }
    };

    fetchPaths();
    const interval = setInterval(fetchPaths, 10000);
    return () => clearInterval(interval);
  }, [selectedRoute]);

  const handleRouteChange = (routeId: string) => {
    setSelectedRoute(routeId);

    setEtaData(null);
    setProximityData(null);
    setPickupPath(null);
    setDropoffPath(null);
    setBusState("approaching");

    const url = new URL(window.location.href);
    if (routeId) url.searchParams.set("routeId", routeId);
    else url.searchParams.delete("routeId");
    window.history.replaceState(window.history.state, "", url.toString());

    if (routeId) {
      fetch(`/api/routes/${routeId}/view`, {
        method: "POST",
      }).catch((err) => {
        console.error("Failed to log view:", err);
      });
    }
  };

  return (
    <PageShell
      fullHeight={true}
      noScroll={true}
      header={
        <>
          <h1 className="font-['Bai_Jamjuree'] text-center text-foreground text-3xl font-bold mt-6">
            {t("home.title")}
          </h1>
          <p className="font-['Bai_Jamjuree'] text-center text-foreground text-base font-medium mt-2 px-4">
            {t("home.subtitle")}
          </p>
        </>
      }
    >
      <div className="relative w-full h-full overflow-hidden">
        <div
          className="absolute w-142.25 h-103.5 -top-26.5 bg-(--gradient-1-bg) blur-(--gradient-1-blur) opacity-(--gradient-1-opacity) pointer-events-none"
          style={{
            left: "calc(50% - 568.85px/2 - 280px)",
            transform: "matrix(-1, 0.03, 0.03, 1, 0, 0)",
          }}
        />
        <div
          className="absolute w-151 h-217.75 -top-80.5 bg-(--gradient-2-bg) blur-(--gradient-2-blur) opacity-(--gradient-2-opacity) pointer-events-none"
          style={{
            left: "calc(50% - 604px/2 + 31.5px)",
            transform: "matrix(-0.93, 0.37, 0.37, 0.93, 0, 0)",
          }}
        />

        {/* Map */}
        <div className="absolute inset-0 z-0">
          <Map
            selectedRoute={selectedRoute}
            pickupPath={pickupPath}
            dropoffPath={dropoffPath}
            busState={busState}
          />
        </div>

        {/* Dropdown */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20">
          <CustomDropdown
            options={routes}
            value={selectedRoute}
            onChange={handleRouteChange}
            loading={loading}
            placeholder={t("home.selectRoute")}
          />
        </div>

        {/* ETA Card */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20">
          <div className="bg-(--card-bg) rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-2">
              {etaData ? (
                <div className="flex flex-col w-full">
                  <span className="font-['Inter'] text-(--eta-text) font-semibold text-sm">
                    🚌 {etaData.minutesDisplay}
                    <span className="text-xs font-normal opacity-70 ml-2">
                      • Arrive at {etaData.arrivalTime}
                    </span>
                  </span>
                </div>
              ) : (
                <span className="font-['Inter'] text-(--eta-text) font-semibold text-sm">
                  {t("home.selectRouteHint")}
                </span>
              )}
            </div>

            {proximityData && proximityData.isNear && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  🚌 Approaching {proximityData.destination}!
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <svg
                className="w-4 h-4 text-[#99121A]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-['Inter'] text-(--disclaimer-text) text-xs">
                {t("home.disclaimer")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}