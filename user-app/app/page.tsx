// app/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import PageShell from "../components/PageShell";

const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

export default function HomePage() {
  const [selectedRoute, setSelectedRoute] = useState("");

  return (
    <PageShell
      fullHeight={true}
      header={
        <>
          <h1 className="font-['Bai_Jamjuree'] text-center text-white text-3xl font-bold mt-6">
            Track your Bus
          </h1>
          <p className="font-['Bai_Jamjuree'] text-center text-white text-base font-medium mt-2 px-4">
            Choose a route to track the bus live on the map and view its estimated arrival time instantly.
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

        {/* Floating Route Dropdown (top of map) */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20">
          <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between">
            <span className="font-['Inter'] text-gray-400 text-sm">Select route</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Floating ETA Card (bottom of screen) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-20">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            {/* ETA */}
            <div className="flex items-center gap-2">
              <span className="font-['Inter'] text-gray-800 font-semibold text-sm">ETA: 9:03 AM</span>
            </div>
            {/* Disclaimer with Star Icon */}
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-4 h-4 text-[#99121A]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-['Inter'] text-gray-500 text-xs">Disclaimer: ETA may vary due to traffic</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}