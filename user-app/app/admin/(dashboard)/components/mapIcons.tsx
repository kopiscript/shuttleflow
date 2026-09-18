import L from "leaflet";

/**
 * Pulsing blue dot for pickup.
 * @param draggable Whether to add a subtle "drag" hint ring.
 */
export const createPickupIcon = () =>
  L.divIcon({
    className: "pickup-marker",
    html: `
      <div style="position: relative; width: 20px; height: 20px;">
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(59, 130, 246, 0.3);
          animation: pulseBlue 1.5s ease-in-out infinite;
        "></div>
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 16px; height: 16px; border-radius: 50%;
          background: #3b82f6; border: 3px solid white;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

export const createDropoffIcon = () =>
  L.divIcon({
    className: "destination-marker",
    html: `
      <div style="position: relative; width: 20px; height: 20px;">
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 30px; height: 30px; border-radius: 50%;
          background: rgba(34, 197, 94, 0.3);
          animation: pulseGreen 1.5s ease-in-out infinite;
        "></div>
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 16px; height: 16px; border-radius: 50%;
          background: #22c55e; border: 3px solid white;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

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