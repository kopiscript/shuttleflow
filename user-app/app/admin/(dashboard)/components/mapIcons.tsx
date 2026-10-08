// app/admin/(dashboard)/components/mapIcons.tsx
import L from "leaflet";

/**
 * @param color  Fill colour of the pin
 * @param ring   Border colour
 * @param label  Single character shown inside the pin head (P/ D)
 */
const createTeardropIcon = (color: string, ring: string, label: string) =>
  L.divIcon({
    className: "teardrop-marker",
    html: `
      <div style="position: relative; width: 34px; height: 44px;">
        <!-- Pulse ring behind the pin head -->
        <div style="
          position: absolute; top: 8px; left: 50%;
          transform: translate(-50%, -50%);
          width: 30px; height: 30px; border-radius: 50%;
          background: ${color}33;
          animation: pulseTeardrop 1.6s ease-in-out infinite;
        "></div>

        <!-- Teardrop / pin shape (SVG) -->
        <svg width="34" height="44" viewBox="0 0 34 44"
             style="position: absolute; top: 0; left: 0; filter: drop-shadow(0 3px 4px rgba(0,0,0,0.35));">
          <!-- Pin body: circle head + triangle tip -->
          <path d="M17 1
                   C 8.16 1 1 8.16 1 17
                   C 1 29 17 43 17 43
                   C 17 43 33 29 33 17
                   C 33 8.16 25.84 1 17 1 Z"
                fill="${color}" stroke="${ring}" stroke-width="2.5" />
          <!-- Letter label -->
          <text x="17" y="20"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="Inter, sans-serif"
                font-size="13"
                font-weight="700"
                fill="${ring}">${label}</text>
        </svg>
      </div>
    `,
    iconSize: [34, 44],
    // Anchor at the pin tip (bottom centre), so the tip sits on the coordinate
    iconAnchor: [17, 43],
    popupAnchor: [0, -40],
  });

/**
 * Pickup stop: blue upside-down teardrop labelled "P".
 */
export const createPickupIcon = () =>
  createTeardropIcon("#3b82f6", "#ffffff", "P");

/**
 * Drop-off stop: green upside-down teardrop labelled "D".
 */
export const createDropoffIcon = () =>
  createTeardropIcon("#bb0c0c", "#ffffff", "D");

/**
 * Active bus: yellow circular marker with bus emoji
 */
export const createBusIcon = () =>
  L.divIcon({
    className: "bus-marker",
    html: `
      <div style="position: relative; width: 36px; height: 36px;">
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(250, 204, 21, 0.25);
          animation: pulseYellow 1.8s ease-in-out infinite;
        "></div>
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 28px; height: 28px; border-radius: 50%;
          background: #facc15; border: 3px solid white;
          box-shadow: 0 0 15px rgba(250, 204, 21, 0.7);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; line-height: 1;
        ">🚌</div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });