// user-app/app/admin/buses/[id]/map/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// 🔥 IMPORTANT: Dynamic import with SSR disabled to fix "window is not defined" error
const FullMap = dynamic(
  () => import("./FullMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-[#171821]">
        <span className="text-[#87888C] font-['Inter'] text-sm">Loading map...</span>
      </div>
    )
  }
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FullMapPage({ params }: PageProps) {
  const [busId, setBusId] = useState<string | null>(null);

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params;
      setBusId(id);
    };
    unwrapParams();
  }, [params]);

  if (!busId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#171821]">
        <span className="text-[#87888C] font-['Inter'] text-sm">Loading...</span>
      </div>
    );
  }

  return <FullMap busId={busId} />;
}