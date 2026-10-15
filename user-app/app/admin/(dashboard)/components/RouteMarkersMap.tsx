"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createPickupIcon, createDropoffIcon, createBusIcon } from "./mapIcons";

type BusState =
  | "approaching"
  | "at_pickup"
  | "en_route_to_dropoff"
  | "trip_done";

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
  routePaths?: Record<number, [number, number][] | null>;
  dropoffPaths?: Record<number, [number, number][] | null>;
  busState?: BusState;   // ← NEW
}

export default function RouteMarkersMap({
  routes,
  buses = [],
  selectedRouteId = null,
  routePaths = {},
  dropoffPaths = {},
  busState = "approaching",
}: RouteMarkersMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const pickupIcon = useMemo(() => createPickupIcon(), []);
  const dropoffIcon = useMemo(() => createDropoffIcon(), []);
  const busIcon = useMemo(() => createBusIcon(), []);

  const DEFAULT_LAT = 3.0742;
  const DEFAULT_LNG = 101.5913;

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

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    const allCoords: [number, number][] = [];

    // Visibility rules based on the bus state
    const showPickupLine =
      busState === "approaching" || busState === "trip_done";
    const showDropoffLine =
      busState === "at_pickup" || busState === "en_route_to_dropoff";

    const visibleRoutes =
      selectedRouteId == null
        ? routes
        : routes.filter((r) => r.id === selectedRouteId);

    const visibleBuses =
      selectedRouteId == null
        ? buses
        : buses.filter((b) => b.routeIds?.includes(Number(selectedRouteId)));

    const busByRouteId = new Map<number, BusMarkerData>();
    for (const bus of visibleBuses) {
      const ids = bus.routeIds ?? (bus.routeId != null ? [bus.routeId] : []);
      for (const rid of ids) {
        if (!busByRouteId.has(rid)) busByRouteId.set(rid, bus);
      }
    }

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

      const assignedBus = busByRouteId.get(route.id);
      const pickupPath = assignedBus ? routePaths[assignedBus.id] : null;
      const dropoffPath = assignedBus ? dropoffPaths[assignedBus.id] : null;

      const hasRealPickupPath =
        Array.isArray(pickupPath) && pickupPath.length > 1;
      const hasRealDropoffPath =
        Array.isArray(dropoffPath) && dropoffPath.length > 1;

      // ---- Bus → Pickup line (blue) — only when approaching or trip done ----
      if (showPickupLine) {
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
      }

      // ---- Bus → Dropoff line (dark red) — only when at_pickup or en_route_to_dropoff ----
      if (showDropoffLine && hasRealDropoffPath) {
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

      // Pickup and dropoff markers — always visible regardless of state
      L.marker(pickupCoord, { icon: pickupIcon })
        .bindTooltip(
          `<b>🚏 ${route.routeName}</b><br/>Pickup: ${route.pickupStop ?? ""}`,
          {
            direction: "top",
            offset: [0, -10],
            opacity: 0.95,
          }
        )
        .addTo(layer);

      L.marker(dropoffCoord, { icon: dropoffIcon })
        .bindTooltip(
          `<b>🏁 ${route.routeName}</b><br/>Drop-off: ${
            route.dropoffStop ?? ""
          }`,
          {
            direction: "top",
            offset: [0, -10],
            opacity: 0.95,
          }
        )
        .addTo(layer);
    });

    // Bus markers
    visibleBuses.forEach((bus) => {
      if (bus.lat == null || bus.lng == null) return;

      const coord: [number, number] = [bus.lat, bus.lng];

      L.marker(coord, { icon: busIcon })
        .bindTooltip(
          `<b>🚌 ${bus.busName}</b><br/>` +
            (bus.routeName ? `Route: ${bus.routeName}<br/>` : "") +
            (bus.status ? `Status: ${bus.status}` : ""),
          {
            direction: "top",
            offset: [0, -10],
            opacity: 0.95,
          }
        )
        .addTo(layer);

      allCoords.push(coord);
    });

    if (allCoords.length > 0) {
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
    busState,   // ← NEW
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