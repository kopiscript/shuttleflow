"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { createPickupIcon, createDropoffIcon } from "./mapIcons";

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

  const [mapReady, setMapReady] = useState(false);

  const onPickupChangeRef = useRef(onPickupChange);
  const onDropoffChangeRef = useRef(onDropoffChange);

  useEffect(() => {
    onPickupChangeRef.current = onPickupChange;
  }, [onPickupChange]);

  useEffect(() => {
    onDropoffChangeRef.current = onDropoffChange;
  }, [onDropoffChange]);

  const pickupIcon = useMemo(() => createPickupIcon(), []);
  const dropoffIcon = useMemo(() => createDropoffIcon(), []);

  const DEFAULT_LAT = 3.0742;
  const DEFAULT_LNG = 101.5913;

  // ============================================================
  // Initialise Leaflet map
  // ============================================================
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [DEFAULT_LAT, DEFAULT_LNG],
      13
    );

    mapRef.current = map;

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    // Tell React that the Leaflet map is now ready.
    setMapReady(true);

    // Make sure the map renders correctly after the container is visible.
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);

    return () => {
      pickupMarkerRef.current?.remove();
      dropoffMarkerRef.current?.remove();
      lineRef.current?.remove();

      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      lineRef.current = null;

      map.remove();

      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // ============================================================
  // Sync pickup / drop-off markers with the coordinates
  // ============================================================
  useEffect(() => {
    // Important:
    // Wait until the Leaflet map has actually been created.
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;

    const pLat = parseFloat(pickupLat);
    const pLng = parseFloat(pickupLng);

    const dLat = parseFloat(dropoffLat);
    const dLng = parseFloat(dropoffLng);

    const hasPickup =
      Number.isFinite(pLat) && Number.isFinite(pLng);

    const hasDropoff =
      Number.isFinite(dLat) && Number.isFinite(dLng);

    // ==========================================================
    // Pickup marker
    // ==========================================================
    if (hasPickup) {
      if (pickupMarkerRef.current) {
        // Existing marker: update its position.
        pickupMarkerRef.current.setLatLng([pLat, pLng]);
      } else {
        // No marker yet: create it.
        pickupMarkerRef.current = L.marker([pLat, pLng], {
          icon: pickupIcon,
          draggable: true,
          autoPan: true,
        })
          .bindPopup(
            "<b>🚏 Pickup Stop</b><br/>Drag me to adjust"
          )
          .addTo(map);

        pickupMarkerRef.current.on("dragend", (e) => {
          const marker = e.target as L.Marker;
          const { lat, lng } = marker.getLatLng();

          onPickupChangeRef.current(
            lat.toFixed(6),
            lng.toFixed(6)
          );
        });
      }
    } else {
      // No valid pickup coordinates: remove marker.
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.remove();
        pickupMarkerRef.current = null;
      }
    }

    // ==========================================================
    // Drop-off marker
    // ==========================================================
    if (hasDropoff) {
      if (dropoffMarkerRef.current) {
        // Existing marker: update its position.
        dropoffMarkerRef.current.setLatLng([dLat, dLng]);
      } else {
        // No marker yet: create it.
        dropoffMarkerRef.current = L.marker([dLat, dLng], {
          icon: dropoffIcon,
          draggable: true,
          autoPan: true,
        })
          .bindPopup(
            "<b>🏁 Drop-off Stop</b><br/>Drag me to adjust"
          )
          .addTo(map);

        dropoffMarkerRef.current.on("dragend", (e) => {
          const marker = e.target as L.Marker;
          const { lat, lng } = marker.getLatLng();

          onDropoffChangeRef.current(
            lat.toFixed(6),
            lng.toFixed(6)
          );
        });
      }
    } else {
      // No valid drop-off coordinates: remove marker.
      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.remove();
        dropoffMarkerRef.current = null;
      }
    }

    // ==========================================================
    // Update dashed line
    // ==========================================================
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
          opacity: 0.6,
        }
      ).addTo(map);
    }

    // ==========================================================
    // Adjust map view
    // ==========================================================
    if (hasPickup && hasDropoff) {
      map.fitBounds(
        L.latLngBounds([
          [pLat, pLng],
          [dLat, dLng],
        ]),
        {
          padding: [60, 60],
        }
      );
    } else if (hasPickup) {
      map.setView([pLat, pLng], 15);
    } else if (hasDropoff) {
      map.setView([dLat, dLng], 15);
    }
  }, [
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    pickupIcon,
    dropoffIcon,
    mapReady,
  ]);

  // ============================================================
  // Click on map to place / change markers
  // ============================================================
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;

    const onClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      const latStr = lat.toFixed(6);
      const lngStr = lng.toFixed(6);

      // If pickup marker does not exist yet,
      // place pickup marker first.
      if (!pickupMarkerRef.current) {
        onPickupChangeRef.current(latStr, lngStr);
        return;
      }

      // If pickup exists but drop-off does not,
      // place drop-off marker.
      if (!dropoffMarkerRef.current) {
        onDropoffChangeRef.current(latStr, lngStr);
        return;
      }

      // Both markers exist.
      // Change whichever marker is closer to the clicked location.
      const pickup = pickupMarkerRef.current.getLatLng();
      const dropoff = dropoffMarkerRef.current.getLatLng();

      const clickedPoint = L.latLng(lat, lng);

      const distanceToPickup = map.distance(
        clickedPoint,
        pickup
      );

      const distanceToDropoff = map.distance(
        clickedPoint,
        dropoff
      );

      if (distanceToPickup < distanceToDropoff) {
        onPickupChangeRef.current(latStr, lngStr);
      } else {
        onDropoffChangeRef.current(latStr, lngStr);
      }
    };

    map.on("click", onClick);

    return () => {
      map.off("click", onClick);
    };
  }, [mapReady]);

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-[400px] rounded-lg border border-[#2C2D33]"
      />

      <div className="flex flex-wrap items-center gap-4 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
          <span className="text-[#87888C] font-['Inter'] text-xs">
            Pickup
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
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