// components/mapIcons.tsx

import L from "leaflet";

/**
 * Pickup stop — teardrop marker with a "P" label and blue tint.
 */
export function createPickupIcon() {
  return L.divIcon({
    className: "pickup-marker",
    html: `
      <div style="position: relative; width: 40px; height: 50px;">
        <svg width="40" height="50" viewBox="0 0 45 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="20" cy="48" rx="14" ry="3" fill="rgba(0,0,0,0.15)"/>
          <path d="M20 0C9.5 0 1 8.5 1 19C1 29.5 20 50 20 50C20 50 39 29.5 39 19C39 8.5 30.5 0 20 0Z"
            fill="#3b82f6"
            stroke="white"
            stroke-width="2.5"/>
          <circle cx="20" cy="18" r="12" fill="white" opacity="0.95"/>
          <text x="20" y="23"
            font-family="Inter, sans-serif"
            font-size="14"
            font-weight="700"
            text-anchor="middle"
            fill="#3b82f6">P</text>
        </svg>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -45],
  });
}

/**
 * Drop-off stop — teardrop marker with a black & white checkered flag.
 */
export function createDropoffIcon() {
  return L.divIcon({
    className: "dropoff-marker",
    html: `
      <div style="position: relative; width: 40px; height: 50px;">
        <svg width="40" height="50" viewBox="0 0 45 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="20" cy="48" rx="14" ry="3" fill="rgba(0,0,0,0.15)"/>
          <path d="M20 0C9.5 0 1 8.5 1 19C1 29.5 20 50 20 50C20 50 39 29.5 39 19C39 8.5 30.5 0 20 0Z"
            fill="#1F2937"
            stroke="white"
            stroke-width="2.5"/>
          <circle cx="20" cy="18" r="13" fill="white" opacity="0.95"/>
          <g transform="translate(11, 9)">
            <rect x="0" y="1" width="1.5" height="16" fill="#1F2937"/>
            <rect x="1.5" y="1" width="5" height="4" fill="#1F2937"/>
            <rect x="6.5" y="1" width="5" height="4" fill="#FFFFFF" stroke="#1F2937" stroke-width="0.5"/>
            <rect x="11.5" y="1" width="5" height="4" fill="#1F2937"/>
            <rect x="1.5" y="5" width="5" height="4" fill="#FFFFFF" stroke="#1F2937" stroke-width="0.5"/>
            <rect x="6.5" y="5" width="5" height="4" fill="#1F2937"/>
            <rect x="11.5" y="5" width="5" height="4" fill="#FFFFFF" stroke="#1F2937" stroke-width="0.5"/>
          </g>
        </svg>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -45],
  });
}

/**
 * Bus marker — larger teardrop with a bus glyph.
 */
export function createBusIcon(_status: string = "active") {
  return L.divIcon({
    className: "bus-marker",
    html: `
      <div style="position: relative; width: 52px; height: 64px;">
        <svg width="52" height="64" viewBox="0 0 55 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="26" cy="61" rx="18" ry="3.5" fill="rgba(0,0,0,0.18)"/>
          <path d="M26 0C12.5 0 1.5 11 1.5 24.5C1.5 38 26 64 26 64C26 64 50.5 38 50.5 24.5C50.5 11 39.5 0 26 0Z"
            fill="#FEB002"
            stroke="white"
            stroke-width="3"/>
          <circle cx="26" cy="23" r="15" fill="white" opacity="0.95"/>
          <svg x="14" y="11" width="24" height="24" viewBox="0 0 24 24" fill="#1F2937">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </svg>
      </div>
    `,
    iconSize: [52, 64],
    iconAnchor: [26, 64],
    popupAnchor: [0, -58],
  });
}