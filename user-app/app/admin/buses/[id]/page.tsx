// user-app/app/admin/buses/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Bus {
  id: number;
  busName: string;
  licensePlate: string;
  capacity: number;
  status: string;
  route?: {
    id: number;
    routeName: string;
    pickupStop: string;
    dropoffStop: string;
  };
  device?: {
    id: number;
    deviceName: string;
    status: string;
    lastSeen: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ActivityLog {
  id: number;
  eventType: string;
  description: string;
  createdAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BusDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [bus, setBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [busId, setBusId] = useState<number | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params;
      setBusId(parseInt(id));
    };
    unwrapParams();
  }, [params]);

  // Fetch bus details
  useEffect(() => {
    if (!busId) return;

    const fetchBusDetails = async () => {
      try {
        const response = await fetch(`/api/admin/buses/${busId}`);
        const data = await response.json();
        if (data.success) {
          setBus(data.bus);
          setIsActive(data.bus.status === "Active");
        }
      } catch (error) {
        console.error("Failed to fetch bus details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusDetails();
  }, [busId]);

  // Fetch activity logs
  useEffect(() => {
    if (!busId) return;

    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/admin/buses/${busId}/logs`);
        const data = await response.json();
        if (data.success) {
          setActivityLogs(data.logs);
        }
      } catch (error) {
        console.error("Failed to fetch activity logs:", error);
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
  }, [busId]);

  const toggleStatus = () => {
    setIsActive(!isActive);
    // Here you would call an API to update the status
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this bus?")) {
      // Handle delete
      router.push("/admin/buses");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#87888C] font-['Inter'] text-sm">Loading bus details...</span>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-4">
        <span className="text-[#87888C] font-['Inter'] text-sm">Bus not found</span>
        <Link href="/admin/buses" className="text-[#96DDFF] hover:underline font-['Inter'] text-sm">
          Back to Shuttle Management
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header with Back Button, Title, Edit, and Delete */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/buses" className="text-white hover:text-[#96DDFF] transition">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
            Bus Details – B{String(bus.id).padStart(3, "0")} ({bus.licensePlate})
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/buses/${bus.id}/edit`}
            className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Details Card */}
        <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
          {/* Basic Information */}
          <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Basic Information</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Bus ID</span>
              <span className="text-white font-['Inter'] text-sm">B{String(bus.id).padStart(3, "0")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">License Plate</span>
              <span className="text-white font-['Inter'] text-sm">{bus.licensePlate}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Bus Model</span>
              <span className="text-white font-['Inter'] text-sm">{bus.busName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Capacity</span>
              <span className="text-white font-['Inter'] text-sm">{bus.capacity}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Status</span>
              <div className="flex items-center gap-3">
                <span className="text-white font-['Inter'] text-sm">{isActive ? "Active" : "Inactive"}</span>
                <button
                  type="button"
                  onClick={toggleStatus}
                  className={`relative w-[46px] h-[23px] rounded-full transition-colors ${
                    isActive ? "bg-[#96DDFF]" : "bg-[#C7C7CC]"
                  }`}
                >
                  <div
                    className={`absolute top-[3px] w-[17px] h-[17px] bg-white rounded-full shadow-md transition-all ${
                      isActive ? "right-[3px]" : "left-[3px]"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2C2D33] my-6" />

          {/* Assigned Route */}
          <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Assigned Route</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Route ID</span>
              <span className="text-white font-['Inter'] text-sm">{bus.route?.id ? `R${String(bus.route.id).padStart(3, "0")}` : "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Route Name</span>
              <span className="text-white font-['Inter'] text-sm">{bus.route?.routeName || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Pickup Stop</span>
              <span className="text-white font-['Inter'] text-sm">{bus.route?.pickupStop || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Drop-off Stop</span>
              <span className="text-white font-['Inter'] text-sm">{bus.route?.dropoffStop || "—"}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2C2D33] my-6" />

          {/* Assigned Device */}
          <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Assigned Device</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Device ID</span>
              <span className="text-white font-['Inter'] text-sm">{bus.device?.id ? `GPS${String(bus.device.id).padStart(3, "0")}` : "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Device Name</span>
              <span className="text-white font-['Inter'] text-sm">{bus.device?.deviceName || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Status</span>
              <span className={`font-['Inter'] text-sm ${bus.device?.status === "Online" ? "text-[#3EB900]" : "text-[#EA1701]"}`}>
                {bus.device?.status || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
              <span className="text-[#87888C] font-['Inter'] text-sm">Last Signal</span>
              <span className="text-white font-['Inter'] text-sm">{bus.device?.lastSeen ? formatDate(bus.device.lastSeen) : "—"}</span>
            </div>
          </div>

          {/* Last updated */}
          <div className="mt-6 text-right">
            <span className="text-[#87888C] font-['Inter'] text-xs">
              Last updated: {formatDate(bus.updatedAt)}
            </span>
          </div>
        </div>

        {/* Right Column - Live Tracking & Activity Log */}
        <div className="space-y-6">
          {/* Live Tracking Card */}
          <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
            <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Live Tracking</h3>
            <div className="bg-[#171821] rounded-xl p-4 h-[196px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-[#87888C] font-['Inter'] text-sm mb-2">📍 Bus Location</div>
                <div className="text-white font-['Inter'] text-xs">
                  Lat: {bus.device?.lastSeen ? "3.0742" : "—"}<br />
                  Lng: {bus.device?.lastSeen ? "101.5438" : "—"}
                </div>
                <div className="mt-4 text-[#87888C] font-['Inter'] text-xs">
                  Last updated: {bus.device?.lastSeen ? formatDate(bus.device.lastSeen) : "No signal"}
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button className="px-6 py-2.5 border border-white text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-white/10 transition">
                View on Full Map
              </button>
            </div>
          </div>

          {/* Activity Log Card - Now showing REAL data from database */}
          <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
            <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Activity Log</h3>
            {logsLoading ? (
              <div className="text-[#87888C] font-['Inter'] text-sm text-center py-4">
                Loading activity logs...
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-[#87888C] font-['Inter'] text-sm text-center py-4">
                No activity recorded yet
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <span className="text-[#87888C] font-['Inter'] text-xs w-24 text-right flex-shrink-0">
                      {formatDate(log.createdAt)}
                    </span>
                    <span className="text-white font-['Inter'] text-xs">
                      {log.description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}