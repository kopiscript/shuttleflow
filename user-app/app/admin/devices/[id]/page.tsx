// app/admin/devices/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Device {
  id: number;
  deviceName: string;
  status: string;
  lastSeen: string | null;
  busId: number | null;
  busName?: string;
  busLicensePlate?: string;  // ✅ Add this
  createdAt: string;
  updatedAt: string;
  signalStrength?: string;
  batteryLevel?: number;
  lastSignal?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DeviceDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unwrap params
  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params;
      setDeviceId(parseInt(id));
    };
    unwrapParams();
  }, [params]);

  // Fetch device details
  useEffect(() => {
    if (!deviceId) return;

    const fetchDeviceDetails = async () => {
      try {
        const response = await fetch(`/api/admin/devices/${deviceId}`);
        const data = await response.json();

        if (data.success) {
          setDevice(data.device);
        }
      } catch (error) {
        console.error("Failed to fetch device details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeviceDetails();
  }, [deviceId]);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/devices/${deviceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/devices");
      } else {
        alert("Failed to delete device: " + data.error);
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error("Error deleting device:", error);
      alert("An error occurred while deleting the device.");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-[#87888C] font-['Inter'] text-sm">Loading device details...</span>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-4">
        <span className="text-[#87888C] font-['Inter'] text-sm">Device not found</span>
        <Link href="/admin/devices" className="text-[#96DDFF] hover:underline font-['Inter'] text-sm">
          Back to Device Management
        </Link>
      </div>
    );
  }

  // Format bus display: Bus ID (License Plate)
  const getBusDisplay = () => {
    if (!device.busId) return "Unassigned";
    const busId = `B${String(device.busId).padStart(3, "0")}`;
    return device.busLicensePlate ? `${busId} (${device.busLicensePlate})` : busId;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/devices" className="text-white hover:text-[#96DDFF] transition">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
            Device Details – {device.deviceName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/devices/${device.id}/edit`}
            className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Two-column layout: Details + Health */}
      <div className="flex gap-6 flex-wrap">
        {/* Left: Basic Information Card */}
        <div className="flex-1 min-w-[300px]">
          <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
            <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Device ID</span>
                <span className="text-white font-['Inter'] text-sm">D{String(device.id).padStart(3, "0")}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Device Name</span>
                <span className="text-white font-['Inter'] text-sm">{device.deviceName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Status</span>
                <span className={`font-['Inter'] text-sm ${device.status === "Online" ? "text-[#3EB900]" : "text-[#EA1701]"}`}>
                  {device.status}
                </span>
              </div>
            </div>
            <div className="mt-4 text-right">
              <span className="text-[#87888C] font-['Inter'] text-xs">
                Created At: {formatDate(device.createdAt)}
              </span>
            </div>
          </div>

          {/* Assigned Bus Info */}
          <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6 mt-6">
            <h3 className="text-white font-bold font-['Inter'] text-base mb-2">Assigned Bus</h3>
            <p className="text-[#87888C] font-['Inter'] text-sm mb-4">
              To change which bus this device is assigned to, go to the Bus Detail page and update the device there.
            </p>
            {device.busId ? (
              <div className="bg-[#171821] rounded-xl p-4 border border-[#2C2D33] flex justify-between items-center">
                <span className="text-white font-['Inter'] text-sm">
                  {getBusDisplay()}
                </span>
                <Link
                  href={`/admin/buses/${device.busId}`}
                  className="text-[#96DDFF] hover:underline font-['Inter'] text-sm"
                >
                  View Bus →
                </Link>
              </div>
            ) : (
              <div className="bg-[#171821] rounded-xl p-4 border border-[#2C2D33] text-center">
                <span className="text-[#87888C] font-['Inter'] text-sm">No bus assigned</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Device Health Card */}
        <div className="w-full md:w-[400px] flex-shrink-0">
          <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6">
            <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Device Health</h3>
            <div className="bg-[#171821] rounded-2xl p-4 space-y-0 overflow-hidden border border-[#2C2D33]">
              {/* Signal Strength */}
              <div className="flex justify-between items-center py-4 border-b border-[#2C2D33]">
                <span className="text-white font-semibold font-['Inter'] text-sm">Signal Strength</span>
                <span className="text-[#3EB900] font-['Inter'] text-sm">Good</span>
              </div>
              {/* Battery Level */}
              <div className="flex justify-between items-center py-4 border-b border-[#2C2D33]">
                <span className="text-white font-semibold font-['Inter'] text-sm">Battery Level</span>
                <span className="text-white font-['Inter'] text-sm">87%</span>
              </div>
              {/* Last Signal */}
              <div className="flex justify-between items-center py-4">
                <span className="text-white font-semibold font-['Inter'] text-sm">Last Signal</span>
                <span className="text-white font-['Inter'] text-sm">
                  {device.lastSeen ? formatDate(device.lastSeen) : "Never"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white font-['Bai_Jamjuree']">Delete Device</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#87888C] hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#CD0000]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#CD0000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              <p className="text-white text-center font-['Inter'] text-base">
                Are you sure you want to delete <br />
                <span className="font-bold text-[#CD0000]">
                  Device {device.deviceName}
                </span>
                ?
              </p>
              <p className="text-[#87888C] text-center font-['Inter'] text-sm mt-2">
                This action cannot be undone. All data associated with this device will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 bg-[#2C2D33] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#3C3D44] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}