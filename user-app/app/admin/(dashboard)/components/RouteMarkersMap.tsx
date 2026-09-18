"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createPickupIcon, createDropoffIcon, createBusIcon } from "./mapIcons";

interface RouteMarkerData {
  id: number;
  routeName: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  status: string;
  pickupStop?: string;
  dropoffStop?: string;
}

export interface BusMarkerData {
  id: number;
  busName: string;
  lat: number;
  lng: number;
  routeId?: number | null;
  routeIds?: number[];
  routeName?: string;
  routeNames?: string[];
  status?: string;
}

interface RouteMarkersMapProps {
  routes: RouteMarkerData[];
  buses?: BusMarkerData[];
  selectedRouteId?: number | null;
}

export default function RouteMarkersMap({
  routes,
  buses = [],
  selectedRouteId = null,
}: RouteMarkersMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const pickupIcon = useMemo(() => createPickupIcon(), []);
  const dropoffIcon = useMemo(() => createDropoffIcon(), []);
  const busIcon = useMemo(() => createBusIcon(), []);

  const DEFAULT_LAT = 3.0742;
  const DEFAULT_LNG = 101.5913;

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView(
      [DEFAULT_LAT, DEFAULT_LNG],
      12
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

    setTimeout(() => mapRef.current?.invalidateSize(), 100);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null; // 👈 FIX #1: honestly null the ref
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    // 👈 FIX #2: capture a stable local reference for this effect run
    const layer = markersLayerRef.current;
    layer.clearLayers();

    const allCoords: [number, number][] = [];

    // Filter routes by selection
    const visibleRoutes =
      selectedRouteId == null
        ? routes
        : routes.filter((r) => r.id === selectedRouteId);

    // Routes → pickup + dropoff + dashed line
    visibleRoutes.forEach((route) => {
      if (
        route.pickupLat == null ||
        route.pickupLng == null ||
        route.dropoffLat == null ||
        route.dropoffLng == null
      )
        return;

      const pickupCoord: [number, number] = [route.pickupLat, route.pickupLng];
      const dropoffCoord: [number, number] = [
        route.dropoffLat,
        route.dropoffLng,
      ];

      L.marker(pickupCoord, { icon: pickupIcon })
        .bindPopup(
          `<b>🚏 ${route.routeName}</b><br/>Pickup: ${route.pickupStop ?? ""}`
        )
        .addTo(layer);

      L.marker(dropoffCoord, { icon: dropoffIcon })
        .bindPopup(
          `<b>🏁 ${route.routeName}</b><br/>Drop-off: ${
            route.dropoffStop ?? ""
          }`
        )
        .addTo(layer);

      L.polyline([pickupCoord, dropoffCoord], {
        color: "#96DDFF",
        weight: 2,
        dashArray: "5, 10",
        opacity: 0.6,
      }).addTo(layer);

      allCoords.push(pickupCoord, dropoffCoord);
    });

    // Filter buses by selection
    const visibleBuses =
      selectedRouteId == null
        ? buses
        : buses.filter((b) => b.routeIds?.includes(Number(selectedRouteId)));

    // Buses → yellow marker
    visibleBuses.forEach((bus) => {
      // 👈 FIX #3: guard null coordinates before constructing the marker
      if (bus.lat == null || bus.lng == null) return;

      const coord: [number, number] = [bus.lat, bus.lng];

      L.marker(coord, { icon: busIcon })
        .bindPopup(
          `<b>🚌 ${bus.busName}</b><br/>` +
            (bus.routeName ? `Route: ${bus.routeName}<br/>` : "") +
            (bus.status ? `Status: ${bus.status}` : "")
        )
        .addTo(layer);

      allCoords.push(coord);
    });

    if (allCoords.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(allCoords), {
        padding: [50, 50],
      });
    }
  }, [routes, buses, selectedRouteId, pickupIcon, dropoffIcon, busIcon]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: "400px" }}
    />
  );
}