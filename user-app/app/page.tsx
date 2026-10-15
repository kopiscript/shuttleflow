// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Pusher from "pusher-js";
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

// Hardware Driver Incident Alert interface
interface ActiveAlert {
  busId: number;
  busName: string;
  status: "Breakdown" | "Delayed";
  driverName?: string | null;
  driverPhone?: string | null;
  message: string;
}

// ---- Polyline helpers (yours) ----
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

  // Proximity state (yours)
  const [proximityData, setProximityData] = useState<ProximityData | null>(
    null
  );

  // Active Incident Alert State (your friend's)
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Path state (yours)
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

          // Restore the route from the URL if it is still available.
          const url = new URL(window.location.href);
          const savedRouteId = url.searchParams.get("routeId");
          const routeExists = sortedRoutes.some(
            (route: Route) => String(route.id) === savedRouteId
          );
          setSelectedRoute(routeExists && savedRouteId ? savedRouteId : "");
          if (savedRouteId !== null && !routeExists) {
            url.searchParams.delete("routeId");
            window.history.replaceState(
              window.history.state,
              "",
              url.toString()
            );
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch routes:", err);
        setLoading(false);
      });
  }, []);

  // Fetch bus location periodically + check proximity + sync active alert state
  useEffect(() => {
    const fetchBusLocationAndAlerts = async () => {
      try {
        const response = await fetch("/api/locations");
        const data = await response.json();
        if (data.success && data.locations?.length > 0) {
          const loc = data.locations[0];
          setBusLocation({
            lat: parseFloat(loc.latitude),
            lng: parseFloat(loc.longitude),
          });

          // Sync active alert status for the selected route (your friend's)
          if (selectedRoute) {
            const routeIdNum = parseInt(selectedRoute);
            const matchingLoc = data.locations.find((l: any) =>
              l.bus?.routeIds?.includes(routeIdNum)
            );

            if (
              matchingLoc &&
              (matchingLoc.bus?.status === "Breakdown" ||
                matchingLoc.bus?.status === "Delayed")
            ) {
              setActiveAlert({
                busId: matchingLoc.busId,
                busName: matchingLoc.bus.busName,
                status: matchingLoc.bus.status,
                driverName: matchingLoc.bus.driverName,
                driverPhone: matchingLoc.bus.driverPhone,
                message:
                  matchingLoc.bus.status === "Breakdown"
                    ? "This bus reported a breakdown. Please take alternative transport."
                    : "This bus reported a major delay. Expect schedule disruption.",
              });
            } else {
              setActiveAlert(null);
            }
          } else {
            setActiveAlert(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch bus location and alerts:", error);
      }

      // Proximity check for the selected route (yours)
      if (selectedRoute) {
        try {
          const res = await fetch(
            `/api/bus/proximity?routeId=${selectedRoute}`
          );
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

    fetchBusLocationAndAlerts();
    const interval = setInterval(fetchBusLocationAndAlerts, 5000);
    return () => clearInterval(interval);
  }, [selectedRoute]);

  // Real-Time Pusher Listener for instant driver hardware alert updates (your friend's)
  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) return;

    const pusher = new Pusher(pusherKey, { cluster: pusherCluster });
    const channel = pusher.subscribe("fleet-alerts");

    channel.bind("bus-status-change", (data: any) => {
      console.log("⚡ Real-time fleet alert received:", data);

      const routeIdNum = parseInt(selectedRoute);
      if (
        selectedRoute &&
        data.routeIds &&
        data.routeIds.includes(routeIdNum)
      ) {
        if (data.status === "Breakdown" || data.status === "Delayed") {
          setActiveAlert({
            busId: data.busId,
            busName: data.busName,
            status: data.status,
            driverName: data.driverName,
            driverPhone: data.driverPhone,
            message: data.message,
          });
        } else if (data.status === "Active") {
          setActiveAlert(null);
          setShowDriverModal(false);
        }
      }
    });

    return () => {
      pusher.unsubscribe("fleet-alerts");
    };
  }, [selectedRoute]);

  // Fetch ETA with auto-refresh every 10 seconds (both)
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

  // Fetch both paths (bus → pickup and bus → dropoff) (yours)
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

    // Clear previous route's information while new data loads
    setEtaData(null);
    setProximityData(null);
    setActiveAlert(null);
    setShowDriverModal(false);
    setPickupPath(null);
    setDropoffPath(null);
    setBusState("approaching");

    // Save selection in URL without reloading
    const url = new URL(window.location.href);
    if (routeId) {
      url.searchParams.set("routeId", routeId);
    } else {
      url.searchParams.delete("routeId");
    }
    window.history.replaceState(window.history.state, "", url.toString());

    // Log view (fire-and-forget) for analytics
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

        {/* Map (both — you added paths, your friend added nothing here) */}
        <div className="absolute inset-0 z-0">
          <Map
            selectedRoute={selectedRoute}
            pickupPath={pickupPath}
            dropoffPath={dropoffPath}
            busState={busState}
          />
        </div>

        {/* Route Dropdown */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20">
          <CustomDropdown
            options={routes}
            value={selectedRoute}
            onChange={handleRouteChange}
            loading={loading}
            placeholder={t("home.selectRoute")}
          />
        </div>

        {/* Floating Bottom Panel: Alert Banner & ETA Card (both) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20 flex flex-col gap-2.5">
          {/* 🚨 DYNAMIC DRIVER INCIDENT BANNER (your friend's) */}
          {activeAlert && (
            <div
              className={`rounded-2xl p-3.5 shadow-xl text-white transition-all backdrop-blur-md flex flex-col gap-2 ${
                activeAlert.status === "Breakdown"
                  ? "bg-red-600/90 border border-red-400"
                  : "bg-amber-600/90 border border-amber-400"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl">
                  {activeAlert.status === "Breakdown" ? "🚨" : "⚠️"}
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-sm leading-tight">
                    {activeAlert.status === "Breakdown"
                      ? "Bus Breakdown Alert"
                      : "Major Route Delay"}
                  </h4>
                  <p className="text-xs opacity-95 mt-0.5 leading-snug">
                    {activeAlert.message}
                  </p>
                </div>
              </div>

              {/* Driver Contact Trigger Button */}
              {activeAlert.driverPhone && (
                <button
                  type="button"
                  onClick={() => setShowDriverModal(true)}
                  className="w-full mt-1 py-1.5 px-3 bg-black/25 hover:bg-black/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/20 transition cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Contact Driver ({activeAlert.driverName || "Assigned Driver"})
                </button>
              )}
            </div>
          )}

          {/* Standard ETA Card */}
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
                  {etaData.distance && (
                    <span className="text-xs text-(--disclaimer-text) opacity-70 mt-0.5">
                      📍 {etaData.distance} from {etaData.pickupStop}
                    </span>
                  )}
                </div>
              ) : (
                <span className="font-['Inter'] text-(--eta-text) font-semibold text-sm">
                  {t("home.selectRouteHint")}
                </span>
              )}
            </div>

            {/* Proximity Status — only show when bus is approaching (yours) */}
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

        {/* 📞 DRIVER CONTACT MODAL (your friend's) */}
        {showDriverModal && activeAlert && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#2B2B36] rounded-2xl max-w-xs w-full p-5 shadow-2xl text-center">
              <div className="w-12 h-12 bg-[#99121A]/10 text-[#99121A] dark:text-[#96DDFF] rounded-full flex items-center justify-center mx-auto text-xl mb-3">
                👤
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {activeAlert.driverName || "Shuttle Driver"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {activeAlert.busName} Operator
              </p>

              <div className="my-4 p-3 bg-gray-50 dark:bg-[#1D1E27] rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 block mb-1">
                  Direct Contact
                </span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {activeAlert.driverPhone || "Not Available"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer"
                >
                  Close
                </button>
                {activeAlert.driverPhone && (
                  <a
                    href={`tel:${activeAlert.driverPhone}`}
                    className="flex-1 py-2 text-xs font-semibold bg-[#99121A] text-white rounded-lg hover:bg-[#7a0e14] transition flex items-center justify-center gap-1"
                  >
                    Call Now
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}