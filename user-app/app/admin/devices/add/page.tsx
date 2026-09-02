// app/admin/devices/add/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Bus {
  id: number;
  busName: string;
  licensePlate: string;
}

export default function AddDevicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loadingBuses, setLoadingBuses] = useState(true);
  const [formData, setFormData] = useState({
    deviceName: "",
    busId: "",
    status: "Offline",
  });

  // Fetch buses for assignment
  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoadingBuses(true);
      const response = await fetch("/api/admin/buses");
      const data = await response.json();
      if (data.success) {
        setBuses(data.buses || []);
      }
    } catch (error) {
      console.error("Failed to fetch buses:", error);
    } finally {
      setLoadingBuses(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStatus = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "Online" ? "Offline" : "Online",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceName: formData.deviceName,
          busId: formData.busId ? parseInt(formData.busId) : null,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/devices");
      } else {
        console.error("Failed to add device:", data.error);
        alert("Failed to add device: " + data.error);
      }
    } catch (error) {
      console.error("Error adding device:", error);
      alert("An error occurred while adding the device.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/devices" className="text-white hover:text-[#96DDFF] transition">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Add New Device
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] max-w-3xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Basic Information
              </h3>

              {/* Device ID - Auto-generated */}
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Device ID</span>
                <span className="text-white font-['Inter'] text-sm">Auto-generated</span>
              </div>

              {/* Device Name */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">Device Name</label>
                <input
                  type="text"
                  name="deviceName"
                  value={formData.deviceName}
                  onChange={handleInputChange}
                  placeholder="Enter device name (e.g., GPS Module #001)"
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#2B2B36]"
                  required
                />
              </div>

              {/* Assign to Bus */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Assign to Bus <span className="text-[#87888C] text-xs">(optional)</span>
                </label>
                <select
                  name="busId"
                  value={formData.busId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                >
                  <option value="">Unassigned</option>
                  {loadingBuses ? (
                    <option disabled>Loading buses...</option>
                  ) : (
                    buses.map((bus) => (
                      <option key={bus.id} value={bus.id}>
                        {bus.busName} ({bus.licensePlate})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Status Toggle */}
              <div className="flex justify-between items-center py-3 border-b border-[#2C2D33] mt-4">
                <span className="text-[#87888C] font-['Inter'] text-sm">Status</span>
                <div className="flex items-center gap-3">
                  <span className={`font-['Inter'] text-sm ${formData.status === "Online" ? "text-[#3EB900]" : "text-[#EA1701]"
                    }`}>
                    {formData.status}
                  </span>
                  <button
                    type="button"
                    onClick={toggleStatus}
                    className={`relative w-[46px] h-[23px] rounded-full transition-colors ${formData.status === "Online" ? "bg-[#96DDFF]" : "bg-[#C7C7CC]"
                      }`}
                  >
                    <div
                      className={`absolute top-[3px] w-[17px] h-[17px] bg-white rounded-full shadow-md transition-all ${formData.status === "Online" ? "right-[3px]" : "left-[3px]"
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2C2D33]">
            <Link
              href="/admin/devices"
              className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition flex items-center gap-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}