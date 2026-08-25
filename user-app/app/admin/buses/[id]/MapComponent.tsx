// user-app/app/admin/buses/[id]/MapComponent.tsx
"use client";

import dynamic from "next/dynamic";

// 🔥 IMPORTANT: Dynamic import with SSR disabled to fix "window is not defined" error
const LeafletMap = dynamic(
  () => import("./LeafletMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-[#171821] rounded-lg">
        <span className="text-[#87888C] font-['Inter'] text-sm">Loading map...</span>
      </div>
    )
  }
);

interface Bus {
  id: number;
  busName: string;
  licensePlate: string;
  capacity: number;
  status: string;
  device?: {
    id: number;
    deviceName: string;
    status: string;
    lastSeen: string;
    lastLat?: number;
    lastLng?: number;
  };
}

export default function MapComponent({ bus }: { bus: Bus }) {
  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-[#2C2D33]">
      <LeafletMap bus={bus} />
    </div>
  );
}