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
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

interface Route {
  id: number;
  routeName: string;
  pickupStop: string;
  dropoffStop: string;
}

export default function HomePage() {
  const { t } = useLanguage();
  const [selectedRoute, setSelectedRoute] = useState("");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [eta, setEta] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch routes when page loads
  useEffect(() => {
    fetch("/api/routes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRoutes(data.routes);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch routes:", err);
        setLoading(false);
      });
  }, []);

  // Fetch ETA when route is selected
  useEffect(() => {
    if (!selectedRoute) {
      setEta("");
      return;
    }

    fetch(`/api/routes/${selectedRoute}/eta`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEta(`ETA: ${data.eta}`);
        } else {
          setEta(t("home.etaUnavailable"));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch ETA:", err);
        setEta(t("home.etaUnavailable"));
      });
  }, [selectedRoute, t]);

  return (
    <PageShell
      fullHeight={true}
      header={
        <>
          <h1 className="font-['Bai_Jamjuree'] text-center text-white text-3xl font-bold mt-6">
            {t("home.title")}
          </h1>
          <p className="font-['Bai_Jamjuree'] text-center text-white text-base font-medium mt-2 px-4">
            {t("home.subtitle")}
          </p>
        </>
      }
    >
      {/* Map Section - fills remaining space */}
      <div className="relative w-full h-full">
        {/* Map fills entire container */}
        <div className="absolute inset-0 z-0">
          <Map selectedRoute={selectedRoute} />
        </div>

        {/* Floating Route Dropdown (top of map) - Custom Dropdown */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20">
          <CustomDropdown
            options={routes}
            value={selectedRoute}
            onChange={setSelectedRoute}
            loading={loading}
            placeholder={t("home.selectRoute")}
          />
        </div>

        {/* Floating ETA Card (bottom of screen) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            {/* ETA */}
            <div className="flex items-center gap-2">
              <span className="font-['Inter'] text-gray-800 font-semibold text-sm">
                {eta || t("home.selectRouteHint")}
              </span>
            </div>
            {/* Disclaimer with Star Icon */}
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-4 h-4 text-[#99121A]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-['Inter'] text-gray-500 text-xs">
                {t("home.disclaimer")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}