"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Create inline SVG markers (no external image dependency)
const createSvgIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="${color}"/><circle cx="12.5" cy="12.5" r="5" fill="white"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    shadowSize: [41, 41],
  });
};

const pickupIcon = createSvgIcon("#1A4B9B");
const dropoffIcon = createSvgIcon("#3EB900");

interface RoutePickerMapProps {
  pickupLat: string;
  pickupLng: string;
  dropoffLat: string;
  dropoffLng: string;
  onPickupChange: (lat: string, lng: string) => void;
  onDropoffChange: (lat: string, lng: string) => void;
}

export default function RoutePickerMap({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  onPickupChange,
  onDropoffChange,
}: RoutePickerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);

  // Store latest callbacks in refs so event handlers always have fresh versions
  const onPickupChangeRef = useRef(onPickupChange);
  const onDropoffChangeRef = useRef(onDropoffChange);

  useEffect(() => {
    onPickupChangeRef.current = onPickupChange;
  }, [onPickupChange]);

  useEffect(() => {
    onDropoffChangeRef.current = onDropoffChange;
  }, [onDropoffChange]);

  // Default center (INTI Subang)
  const DEFAULT_LAT = 3.0742;
  const DEFAULT_LNG = 101.5913;

  // Initialize map (only once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView(
      [DEFAULT_LAT, DEFAULT_LNG],
      13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync markers with props
  useEffect(() => {
    if (!mapRef.current) return;

    const pLat = parseFloat(pickupLat);
    const pLng = parseFloat(pickupLng);
    const dLat = parseFloat(dropoffLat);
    const dLng = parseFloat(dropoffLng);

    const hasPickup = !isNaN(pLat) && !isNaN(pLng);
    const hasDropoff = !isNaN(dLat) && !isNaN(dLng);

    // --- Pickup Marker ---
    if (hasPickup) {
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLatLng([pLat, pLng]);
      } else {
        pickupMarkerRef.current = L.marker([pLat, pLng], {
          icon: pickupIcon,
          draggable: true,
          autoPan: true,
        })
          .bindPopup("<b>Pickup Stop</b><br/>Drag me to adjust")
          .addTo(mapRef.current);

        pickupMarkerRef.current.on("dragend", (e) => {
          const marker = e.target as L.Marker;
          const { lat, lng } = marker.getLatLng();
          onPickupChangeRef.current(lat.toFixed(6), lng.toFixed(6));
        });
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }

    // --- Dropoff Marker ---
    if (hasDropoff) {
      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.setLatLng([dLat, dLng]);
      } else {
        dropoffMarkerRef.current = L.marker([dLat, dLng], {
          icon: dropoffIcon,
          draggable: true,
          autoPan: true,
        })
          .bindPopup("<b>Drop-off Stop</b><br/>Drag me to adjust")
          .addTo(mapRef.current);

        dropoffMarkerRef.current.on("dragend", (e) => {
          const marker = e.target as L.Marker;
          const { lat, lng } = marker.getLatLng();
          onDropoffChangeRef.current(lat.toFixed(6), lng.toFixed(6));
        });
      }
    } else if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.remove();
      dropoffMarkerRef.current = null;
    }

    // --- Dashed Line Between Markers ---
    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }
    if (hasPickup && hasDropoff) {
      lineRef.current = L.polyline(
        [
          [pLat, pLng],
          [dLat, dLng],
        ],
        {
          color: "#96DDFF",
          weight: 2,
          dashArray: "5, 10",
        }
      ).addTo(mapRef.current);
    }

    // --- Auto Fit Bounds ---
    if (hasPickup && hasDropoff) {
      const bounds = L.latLngBounds([
        [pLat, pLng],
        [dLat, dLng],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [60, 60] });
    } else if (hasPickup) {
      mapRef.current.setView([pLat, pLng], 15);
    } else if (hasDropoff) {
      mapRef.current.setView([dLat, dLng], 15);
    }
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng]);

  // Click on Map to Place Markers
  useEffect(() => {
    if (!mapRef.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const latStr = lat.toFixed(6);
      const lngStr = lng.toFixed(6);

      if (!pickupMarkerRef.current) {
        onPickupChangeRef.current(latStr, lngStr);
        return;
      }

      if (!dropoffMarkerRef.current) {
        onDropoffChangeRef.current(latStr, lngStr);
        return;
      }

      const pickupLatLng = pickupMarkerRef.current.getLatLng();
      const dropoffLatLng = dropoffMarkerRef.current.getLatLng();

      const distToPickup = mapRef.current!.distance(
        L.latLng(lat, lng),
        pickupLatLng
      );
      const distToDropoff = mapRef.current!.distance(
        L.latLng(lat, lng),
        dropoffLatLng
      );

      if (distToPickup < distToDropoff) {
        onPickupChangeRef.current(latStr, lngStr);
      } else {
        onDropoffChangeRef.current(latStr, lngStr);
      }
    };

    mapRef.current.on("click", handleMapClick);

    return () => {
      mapRef.current?.off("click", handleMapClick);
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-[400px] rounded-lg border border-[#2C2D33]"
      />
      <div className="flex flex-wrap items-center gap-4 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#1A4B9B]"></div>
          <span className="text-[#87888C] font-['Inter'] text-xs">Pickup</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3EB900]"></div>
          <span className="text-[#87888C] font-['Inter'] text-xs">
            Drop-off
          </span>
        </div>
        <span className="text-[#87888C] font-['Inter'] text-xs ml-auto">
          Drag markers or click on the map to set coordinates
        </span>
      </div>
    </>
  );
}