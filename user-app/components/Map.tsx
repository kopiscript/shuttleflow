"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapProps {
  selectedRoute?: string;
}

export default function Map({ selectedRoute = "" }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on INTI Subang
    mapRef.current = L.map(mapContainerRef.current).setView([3.0742, 101.5438], 13);

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map view when route changes
  useEffect(() => {
    if (!mapRef.current) return;

    const routeViews: Record<string, [number, number, number]> = {
      "campus-loop": [3.0742, 101.5438, 14],
      "north-south": [2.9289, 101.7778, 12],
      "evening-shuttle": [3.0500, 101.6000, 13],
    };

    const view = routeViews[selectedRoute] || [3.0742, 101.5438, 13];
    mapRef.current.setView(view, view[2]);
  }, [selectedRoute]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}