// app/admin/routes/add/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddRoutePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    routeName: "",
    pickupStop: "",
    dropoffStop: "",
    intermediateStops: "",
    status: "Active",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      // Convert comma-separated string to array
      const intermediateStopsArray = formData.intermediateStops
        .split(",")
        .map((stop) => stop.trim())
        .filter((stop) => stop.length > 0);

      const response = await fetch("/api/admin/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeName: formData.routeName,
          pickupStop: formData.pickupStop,
          dropoffStop: formData.dropoffStop,
          intermediateStops: intermediateStopsArray,
          status: formData.status,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        router.push("/admin/routes");
      } else {
        console.error("Failed to add route:", data.error);
        alert("Failed to add route: " + data.error);
      }
    } catch (error) {
      console.error("Error adding route:", error);
      alert("An error occurred while adding the route.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/routes" className="text-white hover:text-[#96DDFF] transition">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Add New Route
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

              {/* Route ID - Auto-generated */}
              <div className="flex justify-between items-center py-2 border-b border-[#2C2D33]">
                <span className="text-[#87888C] font-['Inter'] text-sm">Route ID</span>
                <span className="text-white font-['Inter'] text-sm">Auto-generated</span>
              </div>

              {/* Route Name */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">Route Name</label>
                <input
                  type="text"
                  name="routeName"
                  value={formData.routeName}
                  onChange={handleInputChange}
                  placeholder="Enter route name"
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#2B2B36]"
                  required
                />
              </div>

              {/* Pickup Stop */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">Pickup Stop</label>
                <input
                  type="text"
                  name="pickupStop"
                  value={formData.pickupStop}
                  onChange={handleInputChange}
                  placeholder="Enter pickup stop address"
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#2B2B36]"
                  required
                />
              </div>

              {/* Drop-off Stop */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">Drop-off Stop</label>
                <input
                  type="text"
                  name="dropoffStop"
                  value={formData.dropoffStop}
                  onChange={handleInputChange}
                  placeholder="Enter drop-off stop address"
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#2B2B36]"
                  required
                />
              </div>

              {/* Intermediate Stops */}
              <div className="mt-4">
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Intermediate Stops <span className="text-[#87888C] text-xs">(comma separated)</span>
                </label>
                <textarea
                  name="intermediateStops"
                  value={formData.intermediateStops}
                  onChange={handleInputChange}
                  placeholder="e.g. Main Gate, Library, Admin Building"
                  rows={3}
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm placeholder:text-[#2B2B36] resize-none"
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2C2D33]">
            <Link
              href="/admin/routes"
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