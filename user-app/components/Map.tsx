"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapProps {
  selectedRoute?: string;
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

interface ProximityData {
  isNear: boolean;
  distance: number;
  destination: string;
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

// 🚌 Create bus icon with location pin shape
const createBusIcon = (status: string = 'active') => {
  const color = status === 'active' ? '#99121A' : '#6B7280';
  const isActive = status === 'active';
  
  return L.divIcon({
    className: 'bus-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Location pin shape (teardrop) -->
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Shadow -->
          <ellipse cx="20" cy="48" rx="14" ry="3" fill="rgba(0,0,0,0.15)"/>
          <!-- Pin body -->
          <path d="M20 0C9.5 0 1 8.5 1 19C1 29.5 20 50 20 50C20 50 39 29.5 39 19C39 8.5 30.5 0 20 0Z" 
            fill="${color}" 
            stroke="white" 
            stroke-width="2.5"/>
          <!-- Inner circle background -->
          <circle cx="20" cy="18" r="12" fill="white" opacity="0.95"/>
          <!-- Bus icon inside pin -->
          <svg x="11" y="7" width="18" height="18" viewBox="0 0 24 24" fill="${color}">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
          ${isActive ? `
            <!-- Green pulse dot for active bus -->
            <circle cx="32" cy="38" r="7" fill="#22c55e" stroke="white" stroke-width="2"/>
            <circle cx="32" cy="38" r="7" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.5">
              <animate attributeName="r" from="7" to="14" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          ` : ''}
        </svg>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -45],
  });
};

const isDarkMode = () => document.documentElement.classList.contains("dark");

const getTileUrl = (dark: boolean) => {
  return dark
    ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
};

const getAttribution = (dark: boolean) => {
  return dark
    ? '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
};

export default function Map({ selectedRoute = "" }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for proximity data
  const [proximityData, setProximityData] = useState<ProximityData | null>(null);
  const [proximityLoading, setProximityLoading] = useState(false);

  // Ref to track if map should auto-fit
  const shouldAutoFitRef = useRef(true);
  const fitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch live bus data from API
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
            status: loc.bus?.status || "active"
          }));
          console.log("🚌 Buses fetched:", transformedBuses);
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

  // Fetch route data when selected route changes
  useEffect(() => {
    if (!selectedRoute) {
      setRouteData(null);
      setProximityData(null);
      return;
    }

    const fetchRouteData = async () => {
      try {
        setIsLoading(true);
        console.log(`📡 Fetching route data for ID: ${selectedRoute}`);
        
        const response = await fetch(`/api/routes/${selectedRoute}`);
        const data = await response.json();
        
        console.log("📡 Route API response:", data);
        
        if (data.success) {
          console.log("✅ Route data received:", data.route);
          setRouteData(data.route);
        } else {
          console.error("❌ Failed to fetch route:", data.error);
        }
      } catch (error) {
        console.error("❌ Error fetching route:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRouteData();
  }, [selectedRoute]);

  // Fetch proximity data when route changes
  useEffect(() => {
    if (!selectedRoute) {
      setProximityData(null);
      return;
    }

    const fetchProximity = async () => {
      try {
        setProximityLoading(true);
        const response = await fetch(`/api/routes/${selectedRoute}/track?busId=1`);
        const data = await response.json();

        if (data.success) {
          setProximityData({
            isNear: data.data.isNearDestination || false,
            distance: data.data.distanceToDestination || 0,
            destination: data.data.destination || "Destination",
            status: data.data.status || "en_route",
          });
        }
      } catch (error) {
        console.error("Failed to fetch proximity:", error);
      } finally {
        setProximityLoading(false);
      }
    };

    fetchProximity();
    const interval = setInterval(fetchProximity, 10000);
    return () => clearInterval(interval);
  }, [selectedRoute]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) {
      console.log("⏳ Waiting for map container...");
      return;
    }

    if (mapRef.current) {
      console.log("⚠️ Map already initialized");
      return;
    }

    console.log("🔄 Initializing map...");

    try {
      const dark = isDarkMode();

      mapRef.current = L.map(mapContainerRef.current, {
        center: [3.110135, 101.59775217],
        zoom: 12,
      });

      tileLayerRef.current = L.tileLayer(getTileUrl(dark), {
        attribution: getAttribution(dark),
        maxZoom: 19,
      }).addTo(mapRef.current);

      console.log("✅ Map initialized successfully");
      setMapReady(true);

      // Force a resize after a moment
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    } catch (error) {
      console.error("❌ Failed to initialize map:", error);
    }

    return () => {
      if (mapRef.current) {
        console.log("🗑️ Cleaning up map");
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update route markers when route data changes (NO POLYLINE)
  useEffect(() => {
    console.log("🔄 Route data effect triggered:", { 
      mapReady, 
      hasRouteData: !!routeData, 
      routeData 
    });

    if (!mapRef.current) {
      console.log("⏳ Map reference not ready");
      return;
    }

    if (!mapReady) {
      console.log("⏳ Map not ready");
      return;
    }

    if (!routeData) {
      console.log("⏳ No route data available");
      // Clear markers if no route data
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.remove();
        pickupMarkerRef.current = null;
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }
      return;
    }

    console.log("📍 Adding route markers with data:", routeData);

    // Remove old markers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    // Validate coordinates
    if (!routeData.pickupLat || !routeData.pickupLng || 
        !routeData.dropoffLat || !routeData.dropoffLng) {
      console.error("❌ Invalid coordinates in route data:", routeData);
      return;
    }

    // Create pulsing pickup marker (Blue)
    const pickupIcon = L.divIcon({
      className: 'pickup-marker',
      html: `
        <div style="position: relative; width: 20px; height: 20px;">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.3);
            animation: pulseBlue 1.5s ease-in-out infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            border: 3px solid white;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
          "></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    console.log(`📍 Adding pickup marker at [${routeData.pickupLat}, ${routeData.pickupLng}]`);
    pickupMarkerRef.current = L.marker([routeData.pickupLat, routeData.pickupLng], {
      icon: pickupIcon,
    })
      .bindPopup(`
        <b>🚏 Pickup Point</b><br/>
        ${routeData.pickupStop}
      `)
      .addTo(mapRef.current!);

    // Create pulsing destination marker (Green)
    const destinationIcon = L.divIcon({
      className: 'destination-marker',
      html: `
        <div style="position: relative; width: 20px; height: 20px;">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: rgba(34, 197, 94, 0.3);
            animation: pulseGreen 1.5s ease-in-out infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #22c55e;
            border: 3px solid white;
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
          "></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    console.log(`📍 Adding destination marker at [${routeData.dropoffLat}, ${routeData.dropoffLng}]`);
    destinationMarkerRef.current = L.marker([routeData.dropoffLat, routeData.dropoffLng], {
      icon: destinationIcon,
    })
      .bindPopup(`
        <b>📍 Destination</b><br/>
        ${routeData.dropoffStop}
      `)
      .addTo(mapRef.current!);

    // ❌ ROUTE LINE REMOVED - Buses follow roads, not straight lines

    // Reset auto-fit flag when route changes
    shouldAutoFitRef.current = true;
    
    // Fit map to show both markers
    setTimeout(() => {
      fitMapToBounds();
    }, 200);

  }, [routeData, mapReady]);

  // Fit map to show all markers (with debounce)
  const fitMapToBounds = () => {
    if (!mapRef.current) return;
    if (!shouldAutoFitRef.current) return;

    const markerPositions: L.LatLng[] = [];

    markersRef.current.forEach(marker => {
      const pos = marker.getLatLng();
      if (pos) markerPositions.push(pos);
    });

    if (pickupMarkerRef.current) {
      const pos = pickupMarkerRef.current.getLatLng();
      if (pos) markerPositions.push(pos);
    }

    if (destinationMarkerRef.current) {
      const pos = destinationMarkerRef.current.getLatLng();
      if (pos) markerPositions.push(pos);
    }

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

  // 🚌 Update bus markers with bus icon
  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      console.log("⏳ Map not ready, skipping bus markers");
      return;
    }

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter buses by selected route with safety check
    const filteredBuses = selectedRoute
      ? buses.filter(bus => {
        if (!bus.routeIds || !Array.isArray(bus.routeIds)) {
          console.warn(`⚠️ Bus ${bus.id} has no routeIds:`, bus);
          return false;
        }
        return bus.routeIds.includes(parseInt(selectedRoute));
      })
      : buses;

    console.log(`🎯 Filtered buses for route ${selectedRoute}:`, filteredBuses);

    filteredBuses.forEach((bus) => {
      if (!bus.lat || !bus.lng || isNaN(bus.lat) || isNaN(bus.lng)) {
        console.warn(`⚠️ Skipping bus ${bus.id}: invalid coordinates`);
        return;
      }

      console.log(`📍 Adding bus marker: ${bus.name} at [${bus.lat}, ${bus.lng}]`);

      // 🚌 Create bus icon based on status
      const busIcon = createBusIcon(bus.status);

      const marker = L.marker([bus.lat, bus.lng], { icon: busIcon })
        .bindPopup(`
          <b>🚌 ${bus.name}</b><br/>
          Status: ${bus.status}<br/>
          Routes: ${bus.routeIds?.join(', ') || 'None'}
        `)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Only auto-fit if it's the first load or user hasn't interacted
    if (shouldAutoFitRef.current) {
      // Clear any existing timeout
      if (fitTimeoutRef.current) {
        clearTimeout(fitTimeoutRef.current);
      }
      
      // Debounce: wait 3 seconds after last bus update before fitting
      fitTimeoutRef.current = setTimeout(() => {
        fitMapToBounds();
      }, 3000);
    }
  }, [buses, selectedRoute, mapReady]);

  // Handle map interaction - disable auto-fit when user interacts
  useEffect(() => {
    if (!mapRef.current) return;

    const handleUserInteraction = () => {
      // User dragged or zoomed the map - disable auto-fit
      shouldAutoFitRef.current = false;
      
      // Re-enable auto-fit after 30 seconds of inactivity
      if (fitTimeoutRef.current) {
        clearTimeout(fitTimeoutRef.current);
      }
      fitTimeoutRef.current = setTimeout(() => {
        shouldAutoFitRef.current = true;
      }, 30000); // 30 seconds
    };

    const map = mapRef.current;
    map.on('dragstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);

    return () => {
      map.off('dragstart', handleUserInteraction);
      map.off('zoomstart', handleUserInteraction);
      if (fitTimeoutRef.current) {
        clearTimeout(fitTimeoutRef.current);
      }
    };
  }, [mapReady]);

  // ✅ FIXED: Handle theme changes - removed setAttribution
  useEffect(() => {
    const handleThemeChange = () => {
      if (!mapRef.current || !tileLayerRef.current) return;
      
      const dark = isDarkMode();
      tileLayerRef.current.setUrl(getTileUrl(dark));
      // Attribution is already set when tile layer is created
      // No need to update it dynamically
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full" 
        style={{ 
          minHeight: "400px",
          height: "100%"
        }} 
      />

      {/* Loading indicator */}
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

      {/* Proximity Status Indicator */}
      {proximityData && selectedRoute && (
        <div className="absolute top-4 right-4 z-30 max-w-xs animate-slide-right">
          <div className={`
            rounded-xl shadow-lg p-3 transition-all duration-300
            ${proximityData.isNear
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 dark:text-white'
            }
          `}>
            <div className="flex items-center gap-2">
              <div className={`
                w-3 h-3 rounded-full animate-pulse
                ${proximityData.isNear ? 'bg-white' : 'bg-blue-500'}
              `} />
              <span className="font-semibold text-sm">
                {proximityData.isNear ? '🚌 Approaching!' : 'On Route'}
              </span>
            </div>
            <div className="mt-1">
              <p className={`text-xs ${proximityData.isNear ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>
                {proximityData.isNear
                  ? `${proximityData.distance}m from ${proximityData.destination}`
                  : `${proximityData.distance}m to destination`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator for proximity */}
      {proximityLoading && selectedRoute && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 z-30 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
          <div>Route ID: {selectedRoute || 'None'}</div>
          <div>Route Data: {routeData ? '✅' : '❌'}</div>
          <div>Map Ready: {mapReady ? '✅' : '❌'}</div>
          <div>Pickup: {routeData?.pickupLat?.toFixed(4) || 'N/A'}, {routeData?.pickupLng?.toFixed(4) || 'N/A'}</div>
          <div>Dropoff: {routeData?.dropoffLat?.toFixed(4) || 'N/A'}, {routeData?.dropoffLng?.toFixed(4) || 'N/A'}</div>
          <div>Auto-Fit: {shouldAutoFitRef.current ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
}