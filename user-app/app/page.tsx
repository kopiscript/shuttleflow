
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
}
// ETA data interface
interface ETAData {
  minutes: number;
  minutesDisplay: string;
  arrivalTime: string;
  fullDisplay: string;
  distance: string;
  pickupStop: string;
  destination: string;
  speed: string | null;
}
// Proximity data interface
interface ProximityData {
  isNear: boolean;
  distance: number;
  destination: string;
  status: string;
}
export default function HomePage() {
  const { t } = useLanguage();
  const [selectedRoute, setSelectedRoute] = useState("");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [etaData, setEtaData] = useState<ETAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busLocation, setBusLocation] = useState<{ lat: number; lng: number } | null>(null);
  // Add proximity state
  const [proximityData, setProximityData] = useState<ProximityData | null>(null);
  // Fetch routes when page loads
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
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch routes:", err);
        setLoading(false);
      });
  }, []);
  // Fetch bus location periodically
  useEffect(() => {
    const fetchBusLocation = async () => {
      try {
        const response = await fetch("/api/locations");
        const data = await response.json();
        if (data.success && data.locations && data.locations.length > 0) {
          const loc = data.locations[0];
          setBusLocation({
            lat: parseFloat(loc.latitude),
            lng: parseFloat(loc.longitude),
          });
        }
      } catch (error) {
        console.error("Failed to fetch bus location:", error);
      }
    };
    fetchBusLocation();
    const interval = setInterval(fetchBusLocation, 5000);
    return () => clearInterval(interval);
  }, []);
  // Fetch proximity data when route is selected
  useEffect(() => {
    if (!selectedRoute) {
      setProximityData(null);
      return;
    }
    const fetchProximity = async () => {
      try {
        const response = await fetch(`/api/routes/${selectedRoute}/track?busId=1`);
        const data = await response.json();
        if (data.success) {
          setProximityData({
            isNear: data.data.isNearDestination,
            distance: data.data.distanceToDestination,
            destination: data.data.destination,
            status: data.data.status,
          });
        }
      } catch (error) {
        console.error("Failed to fetch proximity:", error);
      }
    };
    fetchProximity();
    const interval = setInterval(fetchProximity, 5000);
    return () => clearInterval(interval);
  }, [selectedRoute]);
  // Fetch ETA when route is selected
  useEffect(() => {
    if (!selectedRoute) {
      setEtaData(null);
      return;
    }
    fetch(`/api/routes/${selectedRoute}/eta`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("ETA API response:", data);
        if (data.success) {
          setEtaData(data.eta);
        } else {
          setEtaData(null);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch ETA:", err);
        setEtaData(null);
      });
  }, [selectedRoute]);
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
        {/* Gradient Background Elements */}
        <div
          className="absolute w-142.25 h-103.5 -top-26.5 bg-(--gradient-1-bg) blur-(--gradient-1-blur) opacity-(--gradient-1-opacity) pointer-events-none"
          style={{
            left: "calc(50% - 568.85px/2 - 280px)",
            transform: "matrix(-1, 0.03, 0.03, 1, 0, 0)"
          }}
        />
        <div
          className="absolute w-151 h-217.75 -top-80.5 bg-(--gradient-2-bg) blur-(--gradient-2-blur) opacity-(--gradient-2-opacity) pointer-events-none"
          style={{
            left: "calc(50% - 604px/2 + 31.5px)",
            transform: "matrix(-0.93, 0.37, 0.37, 0.93, 0, 0)"
          }}
        />
        {/* Map container - takes full height */}
        <div className="absolute inset-0 z-0">
          <Map selectedRoute={selectedRoute} />
        </div>
        {/* Dropdown - absolute positioned on top */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20">
          <CustomDropdown
            options={routes}
            value={selectedRoute}
            onChange={setSelectedRoute}
            loading={loading}
            placeholder={t("home.selectRoute")}
          />
        </div>
        // In app/page.tsx - Update the ETA card section
        {/* Bottom card - absolute positioned on bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20">
          <div className="bg-(--card-bg) rounded-2xl shadow-lg p-4">
            {/* ETA Display - Like Grab style */}
            <div className="flex items-center gap-2">
              {etaData ? (
                <div className="flex flex-col">
                  {/* Main ETA: "5 min away" like Grab */}
                  <span className="font-['Inter'] text-(--eta-text) font-semibold text-sm">
                    {etaData.minutesDisplay}
                    <span className="text-xs font-normal opacity-70 ml-2">
                      • Arrive at {etaData.arrivalTime}
                    </span>
                  </span>
                  {/* Distance to pickup */}
                  {etaData.distance && (
                    <span className="text-xs text-(--disclaimer-text) opacity-70 mt-0.5">
                      {etaData.distance} from {etaData.pickupStop}
                    </span>
                  )}
                </div>
              ) : (
                <span className="font-['Inter'] text-(--eta-text) font-semibold text-sm">
                  {t("home.selectRouteHint")}
                </span>
              )}
            </div>
            {/* Proximity Status (if bus is near destination) */}
            {proximityData && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs font-medium ${proximityData.isNear
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}>
                  {proximityData.isNear
                    ? `🚌 ${proximityData.distance}m from ${proximityData.destination}`
                    : `${proximityData.distance}m to destination`}
                </span>
              </div>
            )}
            {/* Disclaimer */}
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-4 h-4 text-[#99121A]" fill="currentColor" viewBox="0 0 20 20">
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
