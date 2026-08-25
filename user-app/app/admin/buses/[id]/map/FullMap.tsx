// user-app/app/admin/buses/[id]/map/FullMap.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

export default function FullMap({ busId }: { busId: string }) {
  const [bus, setBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // Use a ref callback to ensure we get the DOM element when ready
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    
    // If map already exists, don't reinitialize
    if (mapRef.current) return;
    
    console.log("✅ Map container node is ready:", node);
    console.log("📏 Container height:", node.clientHeight);
    console.log("📏 Container width:", node.clientWidth);

    const defaultLat = 3.0742;
    const defaultLng = 101.5913;

    try {
      mapRef.current = L.map(node).setView([defaultLat, defaultLng], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      markerRef.current = L.marker([defaultLat, defaultLng])
        .bindPopup("Bus Location")
        .addTo(mapRef.current);

      console.log("✅ Map initialized successfully");
      setMapInitialized(true);

      // Force map to render correctly after mount
      setTimeout(() => {
        if (mapRef.current) {
          console.log("🔄 Invalidating map size...");
          mapRef.current.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error("❌ Error initializing map:", error);
    }
  }, []);

  // Fetch bus data
  useEffect(() => {
    const fetchBus = async () => {
      try {
        const response = await fetch(`/api/admin/buses/${busId}`);
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
  }, [busId]);

  // Update marker when bus data loads AND map is initialized
  useEffect(() => {
    if (!bus || !mapInitialized || !mapRef.current || !markerRef.current) {
      console.log("⏳ Waiting for map or bus data...", { 
        hasBus: !!bus, 
        mapInitialized, 
        hasMap: !!mapRef.current,
        hasMarker: !!markerRef.current 
      });
      return;
    }

    const hasLocation = bus.device?.lastLat && bus.device?.lastLng;

    if (hasLocation) {
      const lat = bus.device.lastLat!;
      const lng = bus.device.lastLng!;
      console.log(`📍 Updating marker to: ${lat}, ${lng}`);
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(
        `<b>${bus.busName}</b><br/>${bus.licensePlate}`
      );
      mapRef.current.setView([lat, lng], 15);
    }
  }, [bus, mapInitialized]);

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

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log("🧹 Cleaning up map...");
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#171821]">
        <span className="text-[#87888C] font-['Inter'] text-sm">Loading bus data...</span>
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

      {/* Full Screen Map - with explicit height */}
      <div className="flex-1 relative min-h-0 bg-[#1D1E27]">
        {/* Map container with ref callback */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full"
          style={{ minHeight: "calc(100vh - 80px)" }} // Force height
        />
      </div>
    </div>
  );
}