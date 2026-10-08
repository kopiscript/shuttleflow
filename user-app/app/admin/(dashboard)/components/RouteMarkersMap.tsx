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
  // Map of busId → bus → pickup road-following path.
  routePaths?: Record<number, [number, number][] | null>;
  // Map of busId → bus → dropoff road-following path.
  // Only populated for the currently selected route.
  dropoffPaths?: Record<number, [number, number][] | null>;
}

export default function RouteMarkersMap({
  routes,
  buses = [],
  selectedRouteId = null,
  routePaths = {},
  dropoffPaths = {},
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
      markersLayerRef.current = null;
    };
  }, []);

  // Update markers + route lines
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    const allCoords: [number, number][] = [];

    // Filter routes by selection
    const visibleRoutes =
      selectedRouteId == null
        ? routes
        : routes.filter((r) => r.id === selectedRouteId);

    // Filter buses by selection (used later for both markers and path lookup)
    const visibleBuses =
      selectedRouteId == null
        ? buses
        : buses.filter((b) => b.routeIds?.includes(Number(selectedRouteId)));

    // Build a quick lookup: routeId → bus (first bus per route)
    const busByRouteId = new Map<number, BusMarkerData>();
    for (const bus of visibleBuses) {
      const ids = bus.routeIds ?? (bus.routeId != null ? [bus.routeId] : []);
      for (const rid of ids) {
        if (!busByRouteId.has(rid)) busByRouteId.set(rid, bus);
      }
    }

    // Routes → pickup + dropoff + route lines
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

      // Find the road-following path for this route, if the assigned
      // bus has an ETA with a TomTom path recorded.
      const assignedBus = busByRouteId.get(route.id);
      const pickupPath = assignedBus ? routePaths[assignedBus.id] : null;
      const dropoffPath = assignedBus ? dropoffPaths[assignedBus.id] : null;

      const hasRealPickupPath =
        Array.isArray(pickupPath) && pickupPath.length > 1;
      const hasRealDropoffPath =
        Array.isArray(dropoffPath) && dropoffPath.length > 1;

      // ---- Bus → Pickup line (blue) ----
      if (hasRealPickupPath) {
        L.polyline(pickupPath!, {
          color: "#3b82f6",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        })
          .addTo(layer)
          .bindTooltip(`Bus → ${route.pickupStop ?? "Pickup"}`, {
            sticky: true,
          });

        for (const coord of pickupPath!) allCoords.push(coord);
      } else {
        // No road path yet (TomTom pending or fallback): straight dashed line
        L.polyline([pickupCoord, dropoffCoord], {
          color: "#3b82f6",
          weight: 3,
          dashArray: "5, 10",
          opacity: 0.8,
          lineCap: "round",
          lineJoin: "round",
        })
          .addTo(layer)
          .bindTooltip(
            `${route.pickupStop ?? "Pickup"} → ${
              route.dropoffStop ?? "Drop-off"
            } (estimated)`,
            { sticky: true }
          );

        allCoords.push(pickupCoord, dropoffCoord);
      }

      // ---- Bus → Dropoff line (amber) ----
      // Only drawn when we actually have a real drop-off path
      // (which only happens when this route is selected).
      if (hasRealDropoffPath) {
        L.polyline(dropoffPath!, {
          color: "#bb0c0c",
          weight: 5,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
        })
          .addTo(layer)
          .bindTooltip(`Bus → ${route.dropoffStop ?? "Drop-off"}`, {
            sticky: true,
          });

        for (const coord of dropoffPath!) allCoords.push(coord);
      }

      // Draw pickup and dropoff markers on top of the lines
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
    });

    // Buses → yellow marker
    visibleBuses.forEach((bus) => {
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
      // Drop any (0, 0) / NaN / Infinity coords that would break the zoom
      const validCoords = allCoords.filter(
        ([lat, lng]) =>
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          !(lat === 0 && lng === 0)
      );

      if (validCoords.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(validCoords), {
          padding: [50, 50],
        });
      }
    }
  }, [
    routes,
    buses,
    selectedRouteId,
    routePaths,
    dropoffPaths,
    pickupIcon,
    dropoffIcon,
    busIcon,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: "400px" }}
    />
  );
}