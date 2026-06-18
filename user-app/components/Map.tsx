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
  routeIds: number[];
  status: string;
}

const isDarkMode = () => document.documentElement.classList.contains("dark");

const getTileUrl = (dark: boolean) => {
  return dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
};

const getAttribution = (dark: boolean) => {
  return dark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | &copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
};

// Coordinates
const INTI_SUBANG = { lat: 3.0742, lng: 101.5913 };
const INTI_NILAI = { lat: 2.8051, lng: 101.7656 };

export default function Map({ selectedRoute = "" }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Fetch live bus data from API
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const response = await fetch("/api/locations");
        const data = await response.json();

        if (data.success && data.locations) {
          const transformedBuses: Bus[] = data.locations.map((loc: any) => ({
            id: loc.busId,
            name: loc.bus?.busName || `Bus ${loc.busId}`,
            lat: parseFloat(loc.latitude),
            lng: parseFloat(loc.longitude),
            routeIds: loc.bus?.routeIds || [],  // Default to empty array
            routeId: loc.bus?.routeIds?.[0] || 0,
            status: loc.bus?.status || "active"
          }));
          console.log("🚌 Buses fetched:", transformedBuses);
          setBuses(transformedBuses);
        }
      } catch (error) {
        console.error("Failed to fetch bus locations:", error);
      }
    };

    fetchBuses();
    const interval = setInterval(fetchBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) {
      console.log("⏳ Waiting for map container...");
      return;
    }

    if (mapRef.current) return;

    console.log("🔄 Initializing map...");

    try {
      const dark = isDarkMode();

      mapRef.current = L.map(mapContainerRef.current, {
        center: [3.110135, 101.59775217],
        zoom: 15,
      });

      tileLayerRef.current = L.tileLayer(getTileUrl(dark), {
        attribution: getAttribution(dark),
        maxZoom: 19,
      }).addTo(mapRef.current);

      console.log("✅ Map initialized successfully");
      setMapReady(true);
    } catch (error) {
      console.error("❌ Failed to initialize map:", error);
    }

    return () => {
      if (mapRef.current) {
        console.log("🗑️ Cleaning up map");
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update pickup marker
  const updatePickupMarker = (routeId: string) => {
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }

    if (!mapRef.current || !routeId) return;

    let pickupLat: number, pickupLng: number, pickupName: string;

    if (routeId === "1") {
      pickupLat = INTI_SUBANG.lat;
      pickupLng = INTI_SUBANG.lng;
      pickupName = "INTI Subang (Pickup)";
    } else if (routeId === "2") {
      pickupLat = INTI_NILAI.lat;
      pickupLng = INTI_NILAI.lng;
      pickupName = "INTI Nilai (Pickup)";
    } else {
      return;
    }

    const pickupIcon = L.divIcon({
      className: 'pickup-marker',
      html: `<div style="
        width: 16px;
        height: 16px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        animation: pulse 1.5s ease-in-out infinite;
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    pickupMarkerRef.current = L.marker([pickupLat, pickupLng], {
      icon: pickupIcon,
    })
      .bindPopup(`<b>🚏 Pickup Point</b><br/>${pickupName}`)
      .addTo(mapRef.current!);
  };

  // Update destination marker
  const updateDestinationMarker = (routeId: string) => {
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (!mapRef.current || !routeId) return;

    let destLat: number, destLng: number, destName: string;

    if (routeId === "1") {
      destLat = INTI_NILAI.lat;
      destLng = INTI_NILAI.lng;
      destName = "INTI Nilai (Destination)";
    } else if (routeId === "2") {
      destLat = INTI_SUBANG.lat;
      destLng = INTI_SUBANG.lng;
      destName = "INTI Subang (Destination)";
    } else {
      return;
    }

    const destinationIcon = L.divIcon({
      className: 'destination-marker',
      html: `<div style="
        width: 16px;
        height: 16px;
        background: #22c55e;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
        animation: pulse 1.5s ease-in-out infinite;
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    destinationMarkerRef.current = L.marker([destLat, destLng], {
      icon: destinationIcon,
    })
      .bindPopup(`<b>📍 Destination</b><br/>${destName}`)
      .addTo(mapRef.current!);
  };

  // Fit map to show all markers
  const fitMapToBounds = () => {
    if (!mapRef.current) return;

    const markerPositions: L.LatLng[] = [];

    markersRef.current.forEach(marker => {
      const pos = marker.getLatLng();
      if (pos) markerPositions.push(pos);
    });

    if (pickupMarkerRef.current) {
      const pos = pickupMarkerRef.current.getLatLng();
      if (pos) markerPositions.push(pos);
    }

    if (destinationMarkerRef.current) {
      const pos = destinationMarkerRef.current.getLatLng();
      if (pos) markerPositions.push(pos);
    }

    if (markerPositions.length >= 2) {
      const bounds = L.latLngBounds(markerPositions);
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
      });
    } else if (markerPositions.length === 1) {
      mapRef.current.setView(markerPositions[0], 14);
    }
  };

  // Update route markers when route changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    updatePickupMarker(selectedRoute);
    updateDestinationMarker(selectedRoute);

    setTimeout(() => {
      fitMapToBounds();
    }, 150);
  }, [selectedRoute, mapReady]);

  // Update bus markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      console.log("⏳ Map not ready, skipping markers");
      return;
    }

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter buses by selected route with safety check
    const filteredBuses = selectedRoute
      ? buses.filter(bus => {
          // Check if routeIds exists and is an array
          if (!bus.routeIds || !Array.isArray(bus.routeIds)) {
            console.warn(`⚠️ Bus ${bus.id} has no routeIds:`, bus);
            return false;
          }
          return bus.routeIds.includes(parseInt(selectedRoute));
        })
      : buses;

    console.log(`🎯 Filtered buses for route ${selectedRoute}:`, filteredBuses);

    filteredBuses.forEach((bus) => {
      if (!bus.lat || !bus.lng || isNaN(bus.lat) || isNaN(bus.lng)) {
        console.warn(`⚠️ Skipping bus ${bus.id}: invalid coordinates`);
        return;
      }

      console.log(`📍 Adding marker: ${bus.name} at [${bus.lat}, ${bus.lng}]`);
      const marker = L.marker([bus.lat, bus.lng])
        .bindPopup(`
          <b>${bus.name}</b><br/>
          Status: ${bus.status}<br/>
          Routes: ${bus.routeIds?.join(', ') || 'None'}
        `)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    setTimeout(() => {
      fitMapToBounds();
    }, 150);
  }, [buses, selectedRoute, mapReady]);

  return <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "400px" }} />;
}