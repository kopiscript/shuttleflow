// user-app/app/admin/buses/[id]/LeafletMap.tsx
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
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

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default coordinates (INTI Subang)
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

    // Add a marker
    markerRef.current = L.marker([defaultLat, defaultLng])
      .bindPopup("Bus Location")
      .addTo(mapRef.current);

    // Force invalidateSize multiple times to fix offset issues
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

    // ResizeObserver — re-invalidates when container resizes
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
    };
  }, []);

  // Update marker when bus data changes
  useEffect(() => {
    if (!bus || !mapRef.current || !markerRef.current) return;

    const hasLocation = bus.device?.lastLat && bus.device?.lastLng;

    if (hasLocation) {
      const lat = bus.device.lastLat!;
      const lng = bus.device.lastLng!;
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(
        `<b>${bus.busName}</b><br/>${bus.licensePlate}<br/>Status: ${
          bus.device?.status || "Unknown"
        }<br/>Last seen: ${formatDate(bus.device?.lastSeen || "")}`
      );
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());

      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 100);
    } else {
      markerRef.current.setPopupContent(
        `<b>${bus.busName}</b><br/>${bus.licensePlate}<br/>Status: No location data`
      );
    }
  }, [bus]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}