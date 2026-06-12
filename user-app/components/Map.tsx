"use client";

import { useEffect, useRef, useState } from "react";
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

interface Bus {
  id: number;
  name: string;
  lat: number;
  lng: number;
  routeId: number;
  status: string;
}

// Mock bus data (replace with real API later)
const mockBuses: Bus[] = [
  { id: 1, name: "Bus B001", lat: 3.0742, lng: 101.5438, routeId: 2, status: "active" },
  { id: 2, name: "Bus B002", lat: 2.9289, lng: 101.7778, routeId: 3, status: "active" },
];

// Helper function to check if dark mode is active
const isDarkMode = () => document.documentElement.classList.contains("dark");

// Get tile layer URL based on theme
const getTileUrl = (dark: boolean) => {
  return dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
};

// Get attribution based on theme
const getAttribution = (dark: boolean) => {
  return dark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | &copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
};

export default function Map({ selectedRoute = "" }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [buses, setBuses] = useState<Bus[]>(mockBuses);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const dark = isDarkMode();
    
    mapRef.current = L.map(mapContainerRef.current).setView([3.0742, 101.5438], 13);

    // Add tile layer
    tileLayerRef.current = L.tileLayer(getTileUrl(dark), {
      attribution: getAttribution(dark),
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Watch for theme changes and update map tiles
  useEffect(() => {
    if (!mapRef.current) return;

    const observer = new MutationObserver(() => {
      const dark = isDarkMode();
      
      // Remove old tile layer
      if (tileLayerRef.current) {
        mapRef.current?.removeLayer(tileLayerRef.current);
      }
      
      // Add new tile layer based on theme
      tileLayerRef.current = L.tileLayer(getTileUrl(dark), {
        attribution: getAttribution(dark),
        maxZoom: 19,
      }).addTo(mapRef.current!);
    });

    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ["class"] 
    });

    return () => observer.disconnect();
  }, []);

  // Update map view when route changes
  useEffect(() => {
    if (!mapRef.current) return;

    const routeViews: Record<string, [number, number, number]> = {
      "2": [3.0742, 101.5438, 14],   // Subang to Nilai
      "3": [2.9289, 101.7778, 12],   // Nilai to Subang
    };

    const view = routeViews[selectedRoute] || [3.0742, 101.5438, 13];
    mapRef.current.setView(view, view[2]);
  }, [selectedRoute]);

  // Update bus markers when selected route changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter buses by selected route (if a route is selected)
    const filteredBuses = selectedRoute 
      ? buses.filter(bus => bus.routeId === parseInt(selectedRoute))
      : buses;

    // Add markers for filtered buses
    filteredBuses.forEach((bus) => {
      const marker = L.marker([bus.lat, bus.lng])
        .bindPopup(`
          <b>${bus.name}</b><br/>
          Status: ${bus.status}<br/>
          Route ID: ${bus.routeId}
        `)
        .addTo(mapRef.current!);
      
      markersRef.current.push(marker);
    });
  }, [buses, selectedRoute]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}