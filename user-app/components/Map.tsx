"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createPickupIcon, createDropoffIcon, createBusIcon } from "./mapIcons";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type BusState = "approaching" | "at_pickup" | "en_route_to_dropoff" | "trip_done";

interface MapProps {
  selectedRoute?: string;
  pickupPath?: [number, number][] | null;
  dropoffPath?: [number, number][] | null;
  busState?: BusState;
}

interface Bus {
  id: number;
  name: string;
  lat: number;
  lng: number;
  routeId: number;
  routeIds: number[];
  status: string;
}

interface RouteData {
  id: number;
  routeName: string;
  pickupStop: string;
  dropoffStop: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

const isDarkMode = () => document.documentElement.classList.contains("dark");

const getTileUrl = (dark: boolean) =>
  dark
    ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const getAttribution = (dark: boolean) =>
  dark
    ? '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function Map({
  selectedRoute = "",
  pickupPath = null,
  dropoffPath = null,
  busState = "approaching",
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);   // ← NEW
  const [buses, setBuses] = useState<Bus[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const shouldAutoFitRef = useRef(true);
  const fitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch live bus data
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const response = await fetch("/api/locations");
        const data = await response.json();
        if (data.success && data.locations) {
          const transformedBuses: Bus[] = data.locations.map((loc: any) => ({
            id: loc.busId,
            name: loc.bus?.busName || `Bus ${loc.busId}`,
            lat: parseFloat(loc.latitude),
            lng: parseFloat(loc.longitude),
            routeIds: loc.bus?.routeIds || [],
            routeId: loc.bus?.routeIds?.[0] || 0,
            status: loc.bus?.status || "active",
          }));
          setBuses(transformedBuses);
        }
      } catch (error) {
        console.error("Failed to fetch bus locations:", error);
      }
    };

    fetchBuses();
    const interval = setInterval(fetchBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch route data
  useEffect(() => {
    if (!selectedRoute) {
      setRouteData(null);
      return;
    }
    const fetchRouteData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/routes/${selectedRoute}`);
        const data = await response.json();
        if (data.success) setRouteData(data.route);
      } catch (error) {
        console.error("Error fetching route:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRouteData();
  }, [selectedRoute]);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const dark = isDarkMode();
    mapRef.current = L.map(mapContainerRef.current, {
      center: [3.110135, 101.59775217],
      zoom: 12,
    });

    tileLayerRef.current = L.tileLayer(getTileUrl(dark), {
      attribution: getAttribution(dark),
      maxZoom: 19,
    }).addTo(mapRef.current);

    setMapReady(true);
    setTimeout(() => mapRef.current?.invalidateSize(), 100);

    return () => {
      polylinesRef.current.forEach((p) => p.remove());
      polylinesRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Marker effect (pickup + dropoff)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if (!routeData) {
      pickupMarkerRef.current?.remove();
      pickupMarkerRef.current = null;
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
      return;
    }

    pickupMarkerRef.current?.remove();
    pickupMarkerRef.current = null;
    destinationMarkerRef.current?.remove();
    destinationMarkerRef.current = null;

    if (
      !routeData.pickupLat ||
      !routeData.pickupLng ||
      !routeData.dropoffLat ||
      !routeData.dropoffLng
    )
      return;

    const pickupIcon = createPickupIcon();
    pickupMarkerRef.current = L.marker(
      [routeData.pickupLat, routeData.pickupLng],
      { icon: pickupIcon }
    )
      .bindTooltip(
        `<b>🚏 Pickup Point</b><br/>${routeData.pickupStop}`,
        { direction: "top", offset: [0, -10], opacity: 0.95 }
      )
      .addTo(mapRef.current!);

    const dropoffIcon = createDropoffIcon();
    destinationMarkerRef.current = L.marker(
      [routeData.dropoffLat, routeData.dropoffLng],
      { icon: dropoffIcon }
    )
      .bindTooltip(
        `<b>🏁 Dropoff Point</b><br/>${routeData.dropoffStop}`,
        { direction: "top", offset: [0, -10], opacity: 0.95 }
      )
      .addTo(mapRef.current!);

    shouldAutoFitRef.current = true;
    setTimeout(() => fitMapToBounds(), 200);
  }, [routeData, mapReady]);

  // ✅ NEW: Polyline effect — draws the visible paths based on busState
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear old polylines
    polylinesRef.current.forEach((p) => p.remove());
    polylinesRef.current = [];

    if (!routeData) return;

    const showPickupLine =
      busState === "approaching" || busState === "trip_done";
    const showDropoffLine =
      busState === "at_pickup" || busState === "en_route_to_dropoff";

    // Bus → pickup (blue)
    if (showPickupLine && pickupPath && pickupPath.length > 1) {
      const line = L.polyline(pickupPath, {
        color: "#3b82f6",
        weight: 5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
      })
        .bindTooltip(`Bus → ${routeData.pickupStop}`, { sticky: true })
        .addTo(mapRef.current!);
      polylinesRef.current.push(line);
    }

    // Bus → dropoff (dark red)
    if (showDropoffLine && dropoffPath && dropoffPath.length > 1) {
      const line = L.polyline(dropoffPath, {
        color: "#bb0c0c",
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round",
      })
        .bindTooltip(`Bus → ${routeData.dropoffStop}`, { sticky: true })
        .addTo(mapRef.current!);
      polylinesRef.current.push(line);
    }
  }, [pickupPath, dropoffPath, busState, routeData, mapReady]);

  const fitMapToBounds = () => {
    if (!mapRef.current) return;
    if (!shouldAutoFitRef.current) return;

    const markerPositions: L.LatLng[] = [];

    markersRef.current.forEach((marker) => {
      const pos = marker.getLatLng();
      if (pos) markerPositions.push(pos);
    });
    if (pickupMarkerRef.current)
      markerPositions.push(pickupMarkerRef.current.getLatLng());
    if (destinationMarkerRef.current)
      markerPositions.push(destinationMarkerRef.current.getLatLng());

    if (markerPositions.length >= 2) {
      const bounds = L.latLngBounds(markerPositions);
      mapRef.current.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 11,
      });
    } else if (markerPositions.length === 1) {
      mapRef.current.setView(markerPositions[0], 13);
    }
  };

  // Bus markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const filteredBuses = selectedRoute
      ? buses.filter((bus) => {
          if (!bus.routeIds || !Array.isArray(bus.routeIds)) return false;
          return bus.routeIds.includes(parseInt(selectedRoute));
        })
      : buses;

    filteredBuses.forEach((bus) => {
      if (!bus.lat || !bus.lng || isNaN(bus.lat) || isNaN(bus.lng)) return;

      const busIcon = createBusIcon(bus.status);
      const marker = L.marker([bus.lat, bus.lng], { icon: busIcon })
        .bindTooltip(
          `<b>🚌 ${bus.name}</b><br/>Status: ${bus.status}<br/>Routes: ${
            bus.routeIds?.join(", ") || "None"
          }`,
          { direction: "top", offset: [0, -10], opacity: 0.95 }
        )
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    if (shouldAutoFitRef.current) {
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
      fitTimeoutRef.current = setTimeout(() => fitMapToBounds(), 3000);
    }
  }, [buses, selectedRoute, mapReady]);

  // User interaction handler
  useEffect(() => {
    if (!mapRef.current) return;

    const handleUserInteraction = () => {
      shouldAutoFitRef.current = false;
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
      fitTimeoutRef.current = setTimeout(() => {
        shouldAutoFitRef.current = true;
      }, 30000);
    };

    const map = mapRef.current;
    map.on("dragstart", handleUserInteraction);
    map.on("zoomstart", handleUserInteraction);

    return () => {
      map.off("dragstart", handleUserInteraction);
      map.off("zoomstart", handleUserInteraction);
      if (fitTimeoutRef.current) clearTimeout(fitTimeoutRef.current);
    };
  }, [mapReady]);

  // Theme change
  useEffect(() => {
    const handleThemeChange = () => {
      if (!mapRef.current || !tileLayerRef.current) return;
      const dark = isDarkMode();
      tileLayerRef.current.setUrl(getTileUrl(dark));
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: "400px", height: "100%" }}
      />

      {isLoading && selectedRoute && (
        <div className="absolute top-4 left-4 z-30">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading route...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}