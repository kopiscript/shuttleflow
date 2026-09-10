// user-app/app/admin/buses/add/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Bus {
  id: number;
  busName: string;
  licensePlate: string;
}

export default function AddBusPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextBusId, setNextBusId] = useState(1);
  const [formData, setFormData] = useState({
    busName: "",
    licensePlate: "",
    capacity: "",
    status: "Active",
    routeId: "",
    deviceId: "",
  });

  // Fetch buses to calculate next ID
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const response = await fetch("/api/admin/buses");
        const data = await response.json();
        if (data.success && data.buses.length > 0) {
          const maxId = Math.max(...data.buses.map((b: Bus) => b.id));
          setNextBusId(maxId + 1);
        }
      } catch (error) {
        console.error("Failed to fetch buses:", error);
      }
    };
    fetchBuses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleStatus = () => {
    setFormData((prev) => ({
      ...prev,
      status: prev.status === "Active" ? "Inactive" : "Active",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/buses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busName: formData.busName,
          licensePlate: formData.licensePlate,
          capacity: parseInt(formData.capacity),
          status: formData.status,
          routeId: formData.routeId ? parseInt(formData.routeId) : null,
          deviceId: formData.deviceId ? parseInt(formData.deviceId) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push("/admin/buses");
      } else {
        console.error("Failed to add bus:", data.error);
      }
    } catch (error) {
      console.error("Error adding bus:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/buses" className="text-white hover:text-[#96DDFF] transition">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Add New Shuttle
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">
                Basic Information
              </h3>

              {/* Bus ID */}
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Bus ID</span>
                <span className="text-white font-['Inter'] text-sm">
                  B{String(nextBusId).padStart(3, "0")}
                </span>
              </div>

              {/* License Plate */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">License Plate</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  placeholder="Enter license plate"
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#2B2B36]"
                  required
                />
              </div>

              {/* Bus Model */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">Bus Model</label>
                <input
                  type="text"
                  name="busName"
                  value={formData.busName}
                  onChange={handleInputChange}
                  placeholder="Enter model"
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#2B2B36]"
                  required
                />
              </div>

              {/* Capacity */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Enter passenger capacity"
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#2B2B36]"
                  required
                  min="1"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex justify-between items-center py-3 border-b border-[#2C2D33] mt-4">
                <span className="text-[#87888C] font-['Inter'] text-sm">Status</span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-['Inter'] text-sm">{formData.status}</span>
                  <button
                    type="button"
                    onClick={toggleStatus}
                    className={`relative w-[46px] h-[23px] rounded-full transition-colors ${
                      formData.status === "Active" ? "bg-[#96DDFF]" : "bg-[#C7C7CC]"
                    }`}
                  >
                    <div
                      className={`absolute top-[3px] w-[17px] h-[17px] bg-white rounded-full shadow-md transition-all ${
                        formData.status === "Active" ? "right-[3px]" : "left-[3px]"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-[#2C2D33]" />

            {/* Assigned Route */}
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Assigned Route</h3>
              <div className="mt-4">
                <div className="relative">
                  <select
                    name="routeId"
                    value={formData.routeId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm appearance-none pr-10"
                  >
                    <option value="">Select route</option>
                    <option value="1">Subang to Nilai</option>
                    <option value="2">Nilai to Subang</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-[#87888C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#2C2D33]" />

            {/* Assigned Device */}
            <div>
              <h3 className="text-white font-bold font-['Inter'] text-base mb-4">Assigned Device</h3>
              <div className="mt-4">
                <div className="relative">
                  <select
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm appearance-none pr-10"
                  >
                    <option value="">Select device</option>
                    <option value="1">GPS-01</option>
                    <option value="2">GPS-02</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-[#87888C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2C2D33]">
            <Link
              href="/admin/buses"
              className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}