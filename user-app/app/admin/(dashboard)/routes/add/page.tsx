"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const RoutePickerMap = dynamic(
  () => import("../../components/RoutePickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-[#171821] rounded-lg border border-[#2C2D33] flex items-center justify-center">
        <span className="text-[#87888C] font-['Inter'] text-sm">
          Loading map...
        </span>
      </div>
    ),
  }
);

export default function AddRoutePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    routeName: "",
    pickupStop: "",
    pickupLat: "",
    pickupLng: "",
    dropoffStop: "",
    dropoffLat: "",
    dropoffLng: "",
    intermediateStops: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Stable callbacks for the map component
  const handlePickupChange = useCallback((lat: string, lng: string) => {
    setFormData((prev) => ({ ...prev, pickupLat: lat, pickupLng: lng }));
  }, []);

  const handleDropoffChange = useCallback((lat: string, lng: string) => {
    setFormData((prev) => ({ ...prev, dropoffLat: lat, dropoffLng: lng }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
          pickupLat: formData.pickupLat ? parseFloat(formData.pickupLat) : null,
          pickupLng: formData.pickupLng ? parseFloat(formData.pickupLng) : null,
          dropoffStop: formData.dropoffStop,
          dropoffLat: formData.dropoffLat
            ? parseFloat(formData.dropoffLat)
            : null,
          dropoffLng: formData.dropoffLng
            ? parseFloat(formData.dropoffLng)
            : null,
          intermediateStops: intermediateStopsArray,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/routes");
      } else {
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
        <Link
          href="/admin/routes"
          className="text-white hover:text-[#96DDFF] transition"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-white font-['Bai_Jamjuree']">
          Add New Route
        </h1>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-2 gap-6 max-w-7xl">
        {/* Left Column: Form */}
        <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33]">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              <h3 className="text-white font-bold font-['Inter'] text-base">
                Route Information
              </h3>

              {/* Route Name */}
              <div>
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Route Name
                </label>
                <input
                  type="text"
                  name="routeName"
                  value={formData.routeName}
                  onChange={handleInputChange}
                  placeholder="e.g. Inti Subang → Caltex Kelana Jaya"
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                  required
                />
              </div>

              {/* Pickup Section */}
              <div className="p-4 bg-[#171821] rounded-lg border border-[#2C2D33]">
                <h4 className="text-[#1A4B9B] font-bold font-['Inter'] text-sm mb-3">
                  Pickup Stop
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="pickupStop"
                      value={formData.pickupStop}
                      onChange={handleInputChange}
                      placeholder="Enter pickup address"
                      className="w-full px-3 py-2 bg-[#21222D] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="pickupLat"
                        value={formData.pickupLat}
                        onChange={handleInputChange}
                        placeholder="3.074200"
                        className="w-full px-3 py-2 bg-[#21222D] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="pickupLng"
                        value={formData.pickupLng}
                        onChange={handleInputChange}
                        placeholder="101.591300"
                        className="w-full px-3 py-2 bg-[#21222D] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dropoff Section */}
              <div className="p-4 bg-[#171821] rounded-lg border border-[#2C2D33]">
                <h4 className="text-[#3EB900] font-bold font-['Inter'] text-sm mb-3">
                  Drop-off Stop
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="dropoffStop"
                      value={formData.dropoffStop}
                      onChange={handleInputChange}
                      placeholder="Enter drop-off address"
                      className="w-full px-3 py-2 bg-[#21222D] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="dropoffLat"
                        value={formData.dropoffLat}
                        onChange={handleInputChange}
                        placeholder="3.074200"
                        className="w-full px-3 py-2 bg-[#21222D] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[#87888C] font-['Inter'] text-xs block mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="dropoffLng"
                        value={formData.dropoffLng}
                        onChange={handleInputChange}
                        placeholder="101.591300"
                        className="w-full px-3 py-2 bg-[#21222D] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Intermediate Stops */}
              <div>
                <label className="text-[#87888C] font-['Inter'] text-sm block mb-2">
                  Intermediate Stops{" "}
                  <span className="text-[#87888C] text-xs">
                    (comma separated)
                  </span>
                </label>
                <textarea
                  name="intermediateStops"
                  value={formData.intermediateStops}
                  onChange={handleInputChange}
                  placeholder="e.g. Main Gate, Library, Admin Building"
                  rows={2}
                  className="w-full px-4 py-3 bg-[#171821] text-white rounded-lg border border-[#2C2D33] focus:outline-none focus:border-[#96DDFF] font-['Inter'] text-sm resize-none"
                />
              </div>

              {/* Status Note */}
              <div className="p-3 bg-[#171821] rounded-lg border border-[#2C2D33]">
                <p className="text-[#87888C] font-['Inter'] text-xs">
                  <span className="text-[#96DDFF] font-semibold">Note:</span>{" "}
                  New routes start as <strong>Inactive</strong>. Assign a bus
                  to activate it.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2C2D33]">
              <Link
                href="/admin/routes"
                className="px-6 py-2.5 bg-[#CD0000] text-white rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#b30000] transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#96DDFF] text-[#171821] rounded-lg font-semibold font-['Inter'] text-sm hover:bg-[#7ec4e8] transition disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Route"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Interactive Map */}
        <div className="bg-[#21222D] rounded-2xl border border-[#2C2D33] p-6 h-fit sticky top-6">
          <h3 className="text-white font-bold font-['Inter'] text-base mb-2">
            Location Preview
          </h3>
          <p className="text-[#87888C] font-['Inter'] text-xs mb-4">
            Drag the markers or click on the map to update coordinates.
          </p>
          <RoutePickerMap
            pickupLat={formData.pickupLat}
            pickupLng={formData.pickupLng}
            dropoffLat={formData.dropoffLat}
            dropoffLng={formData.dropoffLng}
            onPickupChange={handlePickupChange}
            onDropoffChange={handleDropoffChange}
          />
        </div>
      </div>
    </div>
  );
}