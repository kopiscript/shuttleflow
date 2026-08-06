// user-app/app/admin/buses/[id]/map/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  device?: {
    lastLat?: number;
    lastLng?: number;
    lastSeen: string;
    status: string;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FullMapPage({ params }: PageProps) {
  const [bus, setBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Unwrap params and fetch bus
  useEffect(() => {
    const fetchBus = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/admin/buses/${id}`);
        const data = await response.json();
        if (data.success) {
          setBus(data.bus);
        }
      } catch (error) {
        console.error("Failed to fetch bus:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBus();
  }, [params]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultLat = 3.0742;
    const defaultLng = 101.5913;

    mapRef.current = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markerRef.current = L.marker([defaultLat, defaultLng])
      .bindPopup("Bus Location")
      .addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker when bus data loads
  useEffect(() => {
    if (!bus || !mapRef.current || !markerRef.current) return;

    const hasLocation = bus.device?.lastLat && bus.device?.lastLng;

    if (hasLocation) {
      const lat = bus.device.lastLat!;
      const lng = bus.device.lastLng!;
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(
        `<b>${bus.busName}</b><br/>${bus.licensePlate}`
      );
      mapRef.current.setView([lat, lng], 15);
    }
  }, [bus]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#171821]">
        <span className="text-[#87888C] font-['Inter'] text-sm">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#171821]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1D1E27] border-b border-[#2C2D33] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/admin/buses/${bus?.id}`} className="text-white hover:text-[#96DDFF] transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-white font-['Bai_Jamjuree'] text-xl font-bold">
            {bus?.busName || "Bus"} – Live Tracking
          </h1>
        </div>
        <div className="text-[#87888C] font-['Inter'] text-xs">
          Last updated: {bus?.device?.lastSeen ? formatDate(bus.device.lastSeen) : "No signal"}
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}