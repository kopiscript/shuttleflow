"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Bus {
  id: number;
  busName: string;
  licensePlate: string;
  capacity: number;
  status: string;
  device?: {
    id: number;
    deviceName: string;
    status: string;
    lastSeen: string;
    lastLat?: number;
    lastLng?: number;
  };
}

export default function LeafletMap({ bus }: { bus: Bus }) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false); // ← NEW

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Initialize map (runs once)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultLat = 3.0742;
    const defaultLng = 101.5913;

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([defaultLat, defaultLng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // ✅ Mark map as ready — this triggers the marker effect
    setMapReady(true);

    const invalidate = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    const timeouts = [
      setTimeout(invalidate, 50),
      setTimeout(invalidate, 200),
      setTimeout(invalidate, 500),
      setTimeout(invalidate, 1000),
    ];

    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        invalidate();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      if (resizeObserver) resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  // Add/remove marker based on device availability
  useEffect(() => {
    console.log("🟢 Marker effect fired");
    console.log("🟢 bus exists:", !!bus);
    console.log("🟢 mapRef exists:", !!mapRef.current);
    console.log("🟢 mapReady:", mapReady);

    // ✅ Wait for map to be ready
    if (!bus || !mapRef.current || !mapReady) {
      console.log("🟢 RETURNING EARLY — bus, map, or mapReady missing");
      return;
    }

    const hasDevice = !!bus.device?.id;
    const hasLocation = !!bus.device?.lastLat && !!bus.device?.lastLng;
    console.log("🟢 hasDevice:", hasDevice, "hasLocation:", hasLocation);

    // Case 1: No device OR no location → remove marker
    if (!hasDevice || !hasLocation) {
      console.log("🟢 Removing marker (no device or location)");
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    // Case 2: Device + location → show marker
    const lat = bus.device!.lastLat!;
    const lng = bus.device!.lastLng!;
    console.log("🟢 Creating marker at:", lat, lng);

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      console.log("🟢 Marker added to map");
    } else {
      markerRef.current.setLatLng([lat, lng]);
      console.log("🟢 Marker position updated");
    }

    markerRef.current.setPopupContent(
      `<b>${bus.busName}</b><br/>${bus.licensePlate}<br/>Status: ${
        bus.device?.status || "Unknown"
      }<br/>Last seen: ${formatDate(bus.device?.lastSeen || "")}`
    );

    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    console.log("🟢 Map centered on marker");

    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 100);
  }, [bus, mapReady]); // ← Added mapReady dependency

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* No device overlay */}
      {bus && !bus.device?.id && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-lg font-['Inter'] text-center max-w-[80%]">
            No device assigned to this bus. Location unavailable.
          </div>
        </div>
      )}

      {/* Device assigned but no location */}
      {bus && bus.device?.id && !bus.device.lastLat && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-lg font-['Inter'] text-center max-w-[80%]">
            Device assigned but no location data received yet.
          </div>
        </div>
      )}
    </div>
  );
}