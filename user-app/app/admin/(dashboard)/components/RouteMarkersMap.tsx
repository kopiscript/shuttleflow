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

// Custom icons for pickup and dropoff
const pickupIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RouteMarkerData {
  id: number;
  routeName: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  status: string;
}

interface RouteMarkersMapProps {
  routes: RouteMarkerData[];
}

export default function RouteMarkersMap({ routes }: RouteMarkersMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center: INTI Subang
    const defaultLat = 3.0742;
    const defaultLng = 101.5913;

    mapRef.current = L.map(mapContainerRef.current).setView(
      [defaultLat, defaultLng],
      12
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    // Force size invalidation after mount
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

  // Update markers when routes change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    const allCoordinates: [number, number][] = [];

    routes.forEach((route) => {
      // Only show markers for routes with valid coordinates
      if (
        route.pickupLat &&
        route.pickupLng &&
        route.dropoffLat &&
        route.dropoffLng
      ) {
        const pickupCoord: [number, number] = [
          route.pickupLat,
          route.pickupLng,
        ];
        const dropoffCoord: [number, number] = [
          route.dropoffLat,
          route.dropoffLng,
        ];

        // Add pickup marker
        L.marker(pickupCoord, { icon: pickupIcon })
          .bindPopup(
            `<b>${route.routeName}</b><br/><span style="color:#1A4B9B">Pickup Stop</span>`
          )
          .addTo(markersLayerRef.current!);

        // Add dropoff marker
        L.marker(dropoffCoord, { icon: dropoffIcon })
          .bindPopup(
            `<b>${route.routeName}</b><br/><span style="color:#3EB900">Drop-off Stop</span>`
          )
          .addTo(markersLayerRef.current!);

        // Draw a dashed line between pickup and dropoff
        L.polyline([pickupCoord, dropoffCoord], {
          color: "#96DDFF",
          weight: 2,
          dashArray: "5, 10",
          opacity: 0.6,
        }).addTo(markersLayerRef.current!);

        allCoordinates.push(pickupCoord, dropoffCoord);
      }
    });

    // Auto-fit bounds to show all markers
    if (allCoordinates.length > 0) {
      const bounds = L.latLngBounds(allCoordinates);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routes]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: "400px" }}
    />
  );
}